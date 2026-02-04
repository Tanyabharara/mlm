
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, ArrowRight, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface WalletWithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableBalance: number;
    onSuccess?: () => void;
}

export default function WalletWithdrawModal({ isOpen, onClose, availableBalance, onSuccess }: WalletWithdrawModalProps) {
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const withdrawAmount = Number(amount);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            setError("Please enter a valid amount greater than 0");
            return;
        }

        if (withdrawAmount > availableBalance) {
            setError(`Insufficient balance. Maximum withdrawable: $${availableBalance.toFixed(2)}`);
            return;
        }

        setLoading(true);
        try {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/user/withdraw", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ amount: withdrawAmount })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit withdrawal request");

            queryClient.invalidateQueries({ queryKey: ["earnings"] });
            onSuccess?.();
            onClose();
            alert("Withdrawal request submitted successfully! It will be processed after admin approval.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden p-10 md:p-12 space-y-10"
                    >
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black font-outfit uppercase tracking-tighter text-slate-900 dark:text-white">Withdraw Funds</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BEP-20 USDT Settlement</p>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleWithdraw} className="space-y-8">
                            <div className="space-y-4">
                                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 flex justify-between items-center">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Balance</p>
                                        <p className="text-2xl font-black text-[#6C63FF]">${availableBalance.toFixed(2)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-[#6C63FF]/10 text-[#6C63FF] rounded-2xl flex items-center justify-center">
                                        <ShieldCheck size={24} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Amount to Withdraw (USDT)</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#6C63FF] transition-colors">
                                            <DollarSign size={20} />
                                        </div>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-3xl text-lg font-black focus:border-[#6C63FF] focus:outline-none transition-all placeholder:text-slate-200"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="flex justify-between px-2">
                                        <p className="text-[10px] font-bold text-slate-400">Min: $1.00</p>
                                        <button
                                            type="button"
                                            onClick={() => setAmount(availableBalance.toString())}
                                            className="text-[10px] font-black text-[#6C63FF] uppercase tracking-widest hover:underline"
                                        >
                                            Withdraw Max
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold"
                                >
                                    <AlertCircle size={16} />
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !amount || Number(amount) <= 0}
                                className="w-full py-5 bg-[#6C63FF] hover:bg-[#5B52E5] text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#6C63FF]/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>Submit Request <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>

                        <div className="text-center pt-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] leading-relaxed">
                                Funds will be locked until admin verification. <br />
                                Usual processing time: 2-24 hours.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
