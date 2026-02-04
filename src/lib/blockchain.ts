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
  createPurchase,
  getFirstAdminUser,
  updatePlatformPoolBalance,
  createOttSubscription
} from "./firebase-db";

const BSC_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const USDT_CONTRACT = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";

const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function getPlatformConfig() {
  const config = await getAppConfig('PLATFORM_CONFIG');
  const envAddress = process.env.TREASURY_WALLET_ADDRESS;

  if (!config || !config.value) return {
    treasuryAddress: envAddress || '0xYourTreasuryWalletAddressHere',
    planPrice: 6
  };

  try {
    const parsed = JSON.parse(config.value);
    return {
      treasuryAddress: parsed.treasuryAddress || envAddress || '0xYourTreasuryWalletAddressHere',
      planPrice: parseFloat(parsed.planPrice || '6')
    };
  } catch (e) {
    return {
      treasuryAddress: envAddress || '0xYourTreasuryWalletAddressHere',
      planPrice: 6
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

  // 2. Define revenue split ($5 to OTT, $1 to platform pool)
  const ottAmount = 5.0;
  const poolAmount = 1.0;

  const user = await getUserById(intent.userId);
  if (!user) return;

  // 3. Log Activation Transaction with revenue split metadata
  await updatePlatformPoolBalance(poolAmount, "increment");

  const admin = await getFirstAdminUser();
  if (admin) {
    await createTransaction({
      userId: admin.id,
      amount: amount,
      type: 'CREDIT',
      category: 'REVENUE',
      description: `Plan Revenue from ${user.name || intent.userId} (OTT: $${ottAmount}, Pool: $${poolAmount})`,
      txHash: txHash
    });
  }

  await createTransaction({
    userId: intent.userId,
    amount: amount,
    type: 'CREDIT',
    category: 'PLAN_ACTIVATION',
    description: `Plan Activation (OTT: $${ottAmount}, Pool: $${poolAmount})`,
    txHash: txHash
  });

  console.log(`[Revenue] Split: OTT=$${ottAmount}, Pool=$${poolAmount}`);

  // 4. Create Pending OTT Subscription request (Admin must approve)
  const { planPrice } = await getPlatformConfig();
  console.log(`[Flow] Processing Payment: Amount=${amount}, PlanPrice=${planPrice}`);

  if (amount >= planPrice) {
    try {
      await createOttSubscription({
        userId: intent.userId,
        platform: "PREMIUM_ACCESS", // Generic placeholder
        status: "PENDING_APPROVAL",
        paymentIntentId: intent.id
      });
      console.log(`[Flow] Created PENDING_APPROVAL OTT subscription for User ${intent.userId}`);
    } catch (ottError: any) {
      console.error(`[Flow] Error creating OTT subscription: ${ottError.message}`);
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

