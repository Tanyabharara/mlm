"use client";
import React, { useState, useEffect } from 'react';
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount
} from 'wagmi';
import { parseUnits } from 'viem';
import { Loader2, Zap, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'; // Mainnet USDT (BSC)

export default function Web3Payment({ onIdToken }: { onIdToken: () => Promise<string> }) {
    const { isConnected, address } = useAccount();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [adminConfig, setAdminConfig] = useState<any>(null);

    const { writeContract, data: hash, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmedOnChain } =
        useWaitForTransactionReceipt({ hash });

    // Fetch Admin Config on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/admin/config-public'); // New public endpoint for price/address
                const data = await res.json();
                setAdminConfig(data.config);
            } catch (e) {
                console.error("Failed to load platform config");
                // Fallback default
                setAdminConfig({ treasuryAddress: '0xYourTreasuryWalletAddressHere', planPrice: '600' });
            }
        };
        fetchConfig();
    }, []);

    const handlePay = async () => {
        try {
            if (!adminConfig?.treasuryAddress) throw new Error("Platform configuration not loaded");

            setError(null);
            setIsProcessing(true);

            // 1. Generate Payment Intent on Backend
            const idToken = await onIdToken();
            const intentRes = await fetch('/api/web3/intent', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });

            const { intent, error: intentError } = await intentRes.json();
            if (intentError) throw new Error(intentError);

            setPaymentIntentId(intent.id);

            // 2. Execute Wallet Transaction
            const amount = parseUnits(adminConfig.planPrice || '600', 18);

            writeContract({
                address: USDT_ADDRESS,
                abi: [
                    {
                        name: 'transfer',
                        type: 'function',
                        stateMutability: 'nonpayable',
                        inputs: [
                            { name: 'recipient', type: 'address' },
                            { name: 'amount', type: 'uint256' },
                        ],
                        outputs: [{ name: '', type: 'bool' }],
                    },
                ] as const,
                functionName: 'transfer',
                args: [adminConfig.treasuryAddress as `0x${string}`, amount],
            });

        } catch (err: any) {
            setError(err.message || 'Payment failed');
            setIsProcessing(false);
        }
    };

    // When tx is submitted, take user to the status page
    useEffect(() => {
        if (hash && paymentIntentId) {
            onIdToken().then(idToken => {
                fetch('/api/web3/purchase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ txHash: hash, paymentIntentId })
                });
            });

            window.location.href = `/dashboard/payment/${paymentIntentId}?tx=${hash}`;
        }
    }, [hash, paymentIntentId]);

    if (!isConnected) return null;
    if (!adminConfig) return <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#6C63FF]" /></div>;

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {(error || writeError) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="line-clamp-2">{error || writeError?.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 space-y-2 text-white">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                    <span>Connected Wallet</span>
                    <span>Network: BSC</span>
                </div>
                <p className="text-xs font-mono font-bold truncate">{address}</p>
            </div>

            <button
                onClick={handlePay}
                disabled={isProcessing}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl
          bg-white text-[#6C63FF] hover:bg-gray-100 active:scale-95
          ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}
        `}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Preparing...
                    </>
                ) : (
                    <>
                        <Zap className="w-5 h-5" />
                        Activate Plan ({adminConfig.planPrice} USDT)
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>

            <p className="text-[10px] text-center text-white/50 font-bold uppercase tracking-wider">
                Production-Grade Verification (12 Confirms)
            </p>
        </div>
    );
}
