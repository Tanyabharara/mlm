"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle2,
    TrendingUp,
    Users,
    Target,
    ArrowRight,
    Info,
    DollarSign,
    Gift,
    PlusCircle,
    MinusCircle,
    Filter,
    ShieldCheck,
    Lock,
    Sparkles,
    CreditCard,
    ArrowLeftRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { EarningsData } from "@/types/earnings";
import WalletDepositModal from "@/components/WalletDepositModal";
import WalletWithdrawModal from "@/components/WalletWithdrawModal";

export default function WalletPage() {
    const { user: authUser, userData } = useAuth();
    const [filter, setFilter] = useState("all");
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    // Real Earnings Data Query
    const { data: earnings, isLoading: earningsLoading } = useQuery<EarningsData>({
        queryKey: ["earnings", authUser?.email],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const response = await fetch("/api/user/earnings", {
                headers: {
                    "x-user-email": authUser?.email || "",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch earnings");
            return response.json();
        },
        enabled: !!authUser?.uid,
    });

    const isLoading = earningsLoading || !userData;
    const availableBalance = Number(userData?.walletBalance || 0);

    const filteredTransactions = useMemo(() => {
        if (!earnings?.recentTransactions) return [];
        if (filter === "all") return earnings.recentTransactions;
        if (filter === "income") return earnings.recentTransactions.filter(t => t.type === "CREDIT" && t.category !== "PLAN_ACTIVATION");
        if (filter === "withdrawal") return earnings.recentTransactions.filter(t => t.type === "DEBIT");
        return earnings.recentTransactions;
    }, [earnings, filter]);

    if (isLoading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const poolFillPercent = Math.round(((earnings?.autoPool?.filled || 0) / (earnings?.autoPool?.total || 27)) * 100);

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Wallet Hub</h1>
                    <p className="text-slate-400 font-medium">Manage your USDT settlements and pool progress 💎</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsDepositOpen(true)}
                        className="px-6 py-3 bg-[#6C63FF] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#6C63FF]/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <PlusCircle size={14} /> Deposit
                    </button>
                    <button
                        onClick={() => setIsWithdrawOpen(true)}
                        className="px-6 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <ArrowLeftRight size={14} /> Withdraw
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. Main Balance Card (Premium) */}
                <div className="bg-[#6C63FF] rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl shadow-[#6C63FF]/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-[60px]" />
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 px-3 py-1 bg-white/10 rounded-full border border-white/10">Withdrawable Balance</span>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-6xl font-black tracking-tighter">${availableBalance.toFixed(2)}</h2>
                            <p className="text-xs font-bold text-white/60">Verified Node Settlements</p>
                        </div>
                        <div className="pt-8 border-t border-white/10 flex items-center gap-6">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Total Payouts</p>
                                <p className="text-lg font-black">${Number(earnings?.totalPayouts || 0).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Locked Funds</p>
                                <p className="text-lg font-black">${Number(earnings?.pendingWithdrawals || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Total Earnings Overview */}
                <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-gray-100 dark:border-white/5 flex flex-col justify-between space-y-8 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <TrendingUp size={24} />
                        </div>
                        <h4 className="text-sm font-black font-outfit text-slate-900 dark:text-white uppercase tracking-wider">Earnings Performance</h4>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Direct Bonuses</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">${earnings?.directIncome || "0.00"}</h3>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pool Income</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">${earnings?.poolIncome || "0.00"}</h3>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 dark:border-white/5">
                        <p className="text-[10px] font-bold text-[#6C63FF] uppercase tracking-widest">Compounded Growth Model</p>
                    </div>
                </div>

                {/* 3. Quick Actions Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-gray-100 dark:border-white/5 shadow-xl space-y-8">
                    <h3 className="text-xl font-black tracking-tighter">Asset Management</h3>
                    <div className="space-y-4">
                        <ActionItem
                            icon={<CreditCard className="text-[#6C63FF]" />}
                            title="Withdraw USDT"
                            desc="Fast BEP-20 payouts"
                            color="bg-[#6C63FF]/5"
                        />
                        <ActionItem
                            icon={<ArrowLeftRight className="text-[#4CAF50]" />}
                            title="Internal Transfer"
                            desc="Move founds to nodes"
                            color="bg-[#4CAF50]/5"
                        />
                        <ActionItem
                            icon={<ShieldCheck className="text-[#FFD700]" />}
                            title="Node Security"
                            desc="Manage auth levels"
                            color="bg-[#FFD700]/5"
                        />
                    </div>
                </div>
            </div>

            {/* 4. Transactions List (Premium) */}
            <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-black tracking-tighter">Verified Clearances</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">A record of all your node settlements</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")} label="All Syncs" />
                        <FilterBtn active={filter === "income"} onClick={() => setFilter("income")} label="Rewards" />
                        <FilterBtn active={filter === "withdrawal"} onClick={() => setFilter("withdrawal")} label="Payouts" />
                    </div>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-white/5">
                    {filteredTransactions.length === 0 ? (
                        <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No ledger data to display.</div>
                    ) : (
                        filteredTransactions.map((tx: any) => (
                            <TxRow key={tx.id} tx={tx} />
                        ))
                    )}
                </div>
            </div>

            <WalletDepositModal
                isOpen={isDepositOpen}
                onClose={() => setIsDepositOpen(false)}
                onSuccess={() => setIsDepositOpen(false)}
            />

            <WalletWithdrawModal
                isOpen={isWithdrawOpen}
                onClose={() => setIsWithdrawOpen(false)}
                availableBalance={availableBalance}
                onSuccess={() => setIsWithdrawOpen(false)}
            />
        </div>
    );
}

function ActionItem({ icon, title, desc, color }: any) {
    return (
        <div className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-3 rounded-2xl transition-all">
            <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-0.5">{title}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">{desc}</p>
            </div>
            <ArrowRight size={14} className="ml-auto text-slate-200 group-hover:text-[#6C63FF] transition-colors" />
        </div>
    );
}

function TxRow({ tx }: any) {
    const isCredit = tx.type === "CREDIT";
    const isWithdrawal = tx.category === "WITHDRAWAL";

    return (
        <div className="p-8 hover:bg-slate-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group">
            <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${isCredit ? 'bg-[#4CAF50]/10 border-[#4CAF50]/10 text-[#4CAF50]' : 'bg-red-50 border-red-100 text-red-500'}`}>
                    {isWithdrawal ? <Lock size={20} /> : (isCredit ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />)}
                </div>
                <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1.5">{tx.description}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString()}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-full text-[8px] font-black text-slate-400 uppercase">{tx.category}</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className={`text-base font-black ${isCredit ? 'text-[#4CAF50]' : 'text-red-500'}`}>
                    {isCredit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                </p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Settled</p>
            </div>
        </div>
    );
}

function FilterBtn({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-[#6C63FF] text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-[#6C63FF]'}`}
        >
            {label}
        </button>
    );
}
