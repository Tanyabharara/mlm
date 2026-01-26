import { ethers } from 'ethers';
import { getProducer, TOPICS } from './kafka';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BSC_RPC_URL = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/';
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';

const USDT_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function getPlatformConfig() {
    const config = await prisma.appConfig.findUnique({ where: { key: 'PLATFORM_CONFIG' } });
    if (!config) return {
        treasuryAddress: process.env.TREASURY_WALLET_ADDRESS || '0xYourTreasuryWalletAddressHere',
        planPrice: 600
    };
    const parsed = JSON.parse(config.value);
    return {
        treasuryAddress: parsed.treasuryAddress,
        planPrice: parseFloat(parsed.planPrice || '600')
    };
}

export async function verifyOnChain(txHash: string, paymentIntentId: string) {
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    const { treasuryAddress, planPrice } = await getPlatformConfig();

    try {
        const existingIntent = await prisma.paymentIntent.findUnique({
            where: { id: paymentIntentId }
        });

        if (existingIntent?.status === 'VERIFIED') return;

        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt || receipt.status === 0) {
            throw new Error('Transaction failed on-chain or not found');
        }

        const tx = await provider.getTransaction(txHash);
        if (!tx || tx.to?.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
            throw new Error('Invalid contract address target');
        }

        const iface = new ethers.Interface(USDT_ABI);
        const logs = receipt.logs.filter(log => log.address.toLowerCase() === USDT_CONTRACT.toLowerCase());

        let totalUsdtTransferred = BigInt(0);
        for (const log of logs) {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'Transfer' && parsed.args.to.toLowerCase() === treasuryAddress.toLowerCase()) {
                totalUsdtTransferred += BigInt(parsed.args.value.toString());
            }
        }

        const amountInEth = ethers.formatUnits(totalUsdtTransferred, 18);
        if (parseFloat(amountInEth) < planPrice) {
            throw new Error(`Insufficient payment amount. Expected ${planPrice}, got ${amountInEth}`);
        }

        await prisma.paymentIntent.update({
            where: { id: paymentIntentId },
            data: { txHash, status: 'PENDING', confirmations: Number(receipt.confirmations) }
        });

        if (Number(receipt.confirmations) >= 12) {
            await finalizePayment(paymentIntentId, txHash, planPrice);
        }

    } catch (error: any) {
        console.error('On-chain verification error:', error.message);
        await prisma.paymentIntent.update({
            where: { id: paymentIntentId },
            data: { status: 'FAILED' }
        });
    }
}

export async function finalizePayment(paymentIntentId: string, txHash: string, amount: number) {
    const intent = await prisma.paymentIntent.update({
        where: { id: paymentIntentId },
        data: { status: 'VERIFIED', confirmations: 12 }
    });

    const producer = await getProducer();
    await producer.send({
        topic: TOPICS.PAYMENT_CONFIRMED,
        messages: [
            {
                key: intent.userId.toString(),
                value: JSON.stringify({
                    paymentIntentId: intent.id,
                    txHash: txHash,
                    userId: intent.userId,
                    amount: amount
                }),
            },
        ],
    });

    console.log(`[Kafka] Emitted payment.confirmed for Intent ${paymentIntentId}`);
}
