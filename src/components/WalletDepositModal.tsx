"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Wallet, ArrowRight, Loader2, CheckCircle2, ShieldCheck, Zap, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Web3Payment from './Web3Payment';

interface WalletDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialAmount?: string;
}

export default function WalletDepositModal({ isOpen, onClose, onSuccess, initialAmount = "600" }: WalletDepositModalProps) {
    const [amount, setAmount] = useState(initialAmount);
    const [step, setStep] = useState<'input' | 'payment' | 'success'>('input');
    const { user: authUser } = useAuth();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-white/5"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#6C63FF] flex items-center justify-center text-white">
                                <Wallet size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-black uppercase tracking-tight font-outfit">Add Hub Credits</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Binance Smart Chain (USDT)</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        {step === 'input' && (
                            <>
                                <div className="space-y-4 text-center">
                                    <h2 className="text-2xl font-black font-outfit tracking-tight">Enter Deposit Amount</h2>
                                    <p className="text-xs text-slate-500 font-medium">Add USDT to your balance to activate nodes and earn rewards.</p>
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#6C63FF] transition-colors">
                                        <DollarSign size={24} />
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="block w-full pl-14 pr-8 py-6 bg-slate-50 dark:bg-white/5 border-none rounded-3xl text-4xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-[#6C63FF]/10 transition-all placeholder:opacity-20"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-6 flex items-center">
                                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">USDT</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {['600', '1000', '5000'].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setAmount(val)}
                                            className="py-3 px-4 bg-slate-50 dark:bg-white/5 hover:bg-[#6C63FF]/10 hover:text-[#6C63FF] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-[#6C63FF]/30"
                                        >
                                            ${val}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setStep('payment')}
                                    disabled={!amount || Number(amount) <= 0}
                                    className="w-full py-5 bg-[#6C63FF] hover:bg-[#5B52E5] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#6C63FF]/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    Proceed to Settlement <ArrowRight size={16} />
                                </button>
                            </>
                        )}

                        {step === 'payment' && (
                            <div className="space-y-6">
                                <button onClick={() => setStep('input')} className="text-[10px] font-black text-[#6C63FF] uppercase tracking-widest hover:underline flex items-center gap-2">
                                    <X size={12} /> Change Amount (${amount})
                                </button>

                                <div className="space-y-4">
                                    <div className="p-6 bg-[#6C63FF]/5 rounded-3xl border border-[#6C63FF]/10 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total to Pay</p>
                                            <p className="text-2xl font-black text-[#6C63FF] font-outfit">${amount} USDT</p>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-white/5 rounded-full border border-white/50">
                                            <Zap size={14} className="text-amber-500 fill-amber-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Instant</span>
                                        </div>
                                    </div>

                                    <Web3Payment onIdToken={() => authUser!.getIdToken()} amount={amount} />
                                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">
                                        * Deposits of $600+ automatically activate your Growth Plan.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Security Footer */}
                    <div className="p-6 bg-slate-50 dark:bg-white/5 flex items-center justify-center gap-6 border-t border-slate-50 dark:border-white/5">
                        <div className="flex items-center gap-1.5 opacity-40">
                            <ShieldCheck size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">E2E Secure</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-40">
                            <Lock size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Verified Logic</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
