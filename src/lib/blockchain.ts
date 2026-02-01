import { ethers } from "ethers";
import { getProducer, TOPICS } from "./kafka";
import { distributeIncome } from "./income-engine";
import {
  getAppConfig,
  getPaymentIntent,
  updatePaymentIntent,
  createTransaction,
  getUserById,
  updateUser,
  updateWalletBalance,
  getPlans,
  createPurchase
} from "./firebase-db";

const BSC_RPC_URL = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/";
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";

const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function getPlatformConfig() {
  const config = await getAppConfig('PLATFORM_CONFIG');
  const envAddress = process.env.TREASURY_WALLET_ADDRESS;

  if (!config || !config.value) return {
    treasuryAddress: envAddress || '0xYourTreasuryWalletAddressHere',
    planPrice: 600
  };

  try {
    const parsed = JSON.parse(config.value);
    return {
      treasuryAddress: parsed.treasuryAddress || envAddress || '0xYourTreasuryWalletAddressHere',
      planPrice: parseFloat(parsed.planPrice || '600')
    };
  } catch (e) {
    return {
      treasuryAddress: envAddress || '0xYourTreasuryWalletAddressHere',
      planPrice: 600
    };
  }
}

export async function verifyOnChain(txHash: string, paymentIntentId: string) {
  const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
  const { treasuryAddress } = await getPlatformConfig();

  try {
    const existingIntent = await getPaymentIntent(paymentIntentId);

    if (!existingIntent || existingIntent.status === 'VERIFIED') return;

    // SANDBOX MODE: Bypass real chain verification
    if (txHash.startsWith('sandbox_')) {
      console.log(`[Flow] Sandbox payment detected for Intent: ${paymentIntentId}`);
      await finalizePayment(paymentIntentId, txHash, Number(existingIntent.amount));
      console.log(`[Flow] Sandbox payment finalized for Intent: ${paymentIntentId}`);
      return;
    }

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

    await updatePaymentIntent(paymentIntentId, {
      txHash,
      status: 'PENDING',
      confirmations: Number(receipt.confirmations)
    });

    // Settle immediately on 1 confirmation
    if (Number(receipt.confirmations) >= 1) {
      await finalizePayment(paymentIntentId, txHash, parseFloat(amountInEth));
    }

  } catch (error: any) {
    console.error('On-chain verification error:', error.message);
    await updatePaymentIntent(paymentIntentId, { status: 'FAILED' });
  }
}

export async function finalizePayment(paymentIntentId: string, txHash: string, amount: number) {
  const intent = await getPaymentIntent(paymentIntentId);
  if (!intent || intent.status === 'VERIFIED') return;

  // 1. Mark Payment as Verified
  await updatePaymentIntent(paymentIntentId, { status: 'VERIFIED', confirmations: 12 });

  // 2. Log Deposit Transaction
  await createTransaction({
    userId: intent.userId,
    amount: amount,
    type: 'CREDIT',
    category: 'DEPOSIT',
    description: `Wallet Deposit (TX: ${txHash.substring(0, 10)}...)`,
    txHash: txHash
  });

  // 3. Update User Wallet Balance
  await updateWalletBalance(intent.userId, amount, "increment");

  const user = await getUserById(intent.userId);
  if (!user) return;

  console.log(`[Flow] Wallet updated for User ${intent.userId}. New Balance: ${user.walletBalance}`);

  // 4. If amount matches plan price and user has no plan, activate it
  const { planPrice } = await getPlatformConfig();
  console.log(`[Flow] Checking for Plan Activation: Amount=${amount}, PlanPrice=${planPrice}, ExistingPlan=${user.planId}`);

  if (amount >= planPrice && !user.planId) {
    try {
      const plans = await getPlans();
      const plan = plans[0]; // Take the first available plan
      if (plan) {
        await updateUser(intent.userId, { planId: plan.id });

        const purchase = await createPurchase({
          userId: intent.userId,
          planId: plan.id
        });

        console.log(`[Flow] Activating Plan via Deposit for Purchase ${purchase.id}`);
        await distributeIncome(purchase.id);
      }
    } catch (planError: any) {
      console.error(`[Flow] Critical: Plan activation failed, but wallet was credited: ${planError.message}`);
    }
  }

  // 5. Kafka Notification (Mandatory)
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
}

