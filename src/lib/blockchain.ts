import { ethers } from 'ethers';
import { getProducer, TOPICS } from './kafka';
import { distributeIncome } from './income-engine';
import prisma from './prisma';
const BSC_RPC_URL = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/';
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';

const USDT_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function getPlatformConfig() {
    const config = await prisma.appConfig.findUnique({ where: { key: 'PLATFORM_CONFIG' } });
    const envAddress = process.env.TREASURY_WALLET_ADDRESS;

    if (!config) return {
        treasuryAddress: envAddress || '0xYourTreasuryWalletAddressHere',
        planPrice: 600
    };

    const parsed = JSON.parse(config.value);
    return {
        // Prefer DB address if it exists, otherwise fallback to ENV
        treasuryAddress: parsed.treasuryAddress || envAddress || '0xYourTreasuryWalletAddressHere',
        planPrice: parseFloat(parsed.planPrice || '600')
    };
}

export async function verifyOnChain(txHash: string, paymentIntentId: string) {
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    const { treasuryAddress } = await getPlatformConfig();

    try {
        const existingIntent = await prisma.paymentIntent.findUnique({
            where: { id: paymentIntentId }
        });

        if (!existingIntent || existingIntent.status === 'VERIFIED') return;

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
        const expectedAmount = Number(existingIntent.amount);

        if (parseFloat(amountInEth) < expectedAmount) {
            throw new Error(`Insufficient payment amount. Expected ${expectedAmount}, got ${amountInEth}`);
        }

        await prisma.paymentIntent.update({
            where: { id: paymentIntentId },
            data: { txHash, status: 'PENDING', confirmations: Number(receipt.confirmations) }
        });

        // Settle immediately on 1 confirmation
        if (Number(receipt.confirmations) >= 1) {
            await finalizePayment(paymentIntentId, txHash, parseFloat(amountInEth));
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
    const intent = await prisma.paymentIntent.findUnique({
        where: { id: paymentIntentId },
        include: { user: true }
    });
    if (!intent || intent.status === 'VERIFIED') return;

    // 1. Mark Payment as Verified
    await prisma.paymentIntent.update({
        where: { id: paymentIntentId },
        data: { status: 'VERIFIED', confirmations: 12 }
    });

    // 2. Log Deposit Transaction
    await prisma.transaction.create({
        data: {
            userId: intent.userId,
            amount: amount,
            type: 'CREDIT',
            category: 'DEPOSIT',
            description: `Wallet Deposit (TX: ${txHash.substring(0, 10)}...)`,
            txHash: txHash
        }
    });

    // 3. Update User Wallet Balance
    const updatedUser = await prisma.user.update({
        where: { id: intent.userId },
        data: {
            walletBalance: { increment: amount }
        }
    });

    // 4. If amount matches plan price and user has no plan, activate it
    const { planPrice } = await getPlatformConfig();
    if (amount >= planPrice && !updatedUser.planId) {
        const plan = await prisma.plan.findFirst();
        if (plan) {
            await prisma.user.update({
                where: { id: intent.userId },
                data: { planId: plan.id }
            });

            const purchase = await prisma.purchase.create({
                data: {
                    userId: intent.userId,
                    planId: plan.id
                }
            });

            console.log(`[Flow] Activating Plan via Deposit for Purchase ${purchase.id}`);
            await distributeIncome(purchase.id);
        }
    }

    // 5. Kafka Notification (Optional)
    try {
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
    } catch (e: any) {
        console.warn("[Kafka] Sync failed (Likely local env), continuing with direct distribution.");
    }
}
