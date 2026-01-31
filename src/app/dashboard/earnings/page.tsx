"use client";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    Wallet,
    Loader2,
    ArrowRight,
    Download,
    Calendar,
    ChevronDown,
    LayoutDashboard
} from "lucide-react";
import { EarningsData } from "@/types/earnings";
import { motion } from "framer-motion";

export default function EarningsPage() {
    const { user } = useAuth();

    const { data, isLoading, error } = useQuery<EarningsData>({
        queryKey: ["earnings", user?.email],
        queryFn: async () => {
            const response = await fetch("/api/user/earnings", {
                headers: {
                    "x-user-email": user?.email || "",
                    Authorization: `Bearer ${await user!.getIdToken()}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch earnings");
            return response.json();
        },
        enabled: !!user?.uid,
    });

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#6C63FF]" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Analytics...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-10 text-center text-red-500 font-bold">Failed to load analytics data.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 md:px-0">
            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Earnings Analytics</h1>
                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                        <span>Real-time income reveal for lili’s list*</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm">
                        <Calendar size={14} className="text-[#6C63FF]" />
                        Last 30 Days
                        <ChevronDown size={14} />
                    </button>
                    <button className="p-3 bg-[#6C63FF] text-white rounded-2xl shadow-lg shadow-[#6C63FF]/20 hover:scale-105 transition-transform">
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* 2. Primary Stat Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Large Total Earnings Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-[#0F172A] rounded-[48px] p-10 md:p-12 text-white relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C63FF]/20 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-[#6C63FF]/30 transition-colors" />

                    <div className="relative z-10 space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                <TrendingUp className="text-[#6C63FF] w-6 h-6" />
                            </div>
                            <span className="px-4 py-1.5 bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20 rounded-full text-[10px] font-black uppercase tracking-widest">+12.5% increase</span>
                        </div>

                        <div className="space-y-2">
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Lifetime Revenue</p>
                            <h2 className="text-6xl md:text-8xl font-black tracking-tight">${data?.totalEarnings || "0.00"}</h2>
                        </div>

                        <div className="flex flex-wrap gap-10 border-t border-white/5 pt-10">
                            <div>
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Direct Referrals</p>
                                <p className="text-xl font-black">${data?.directIncome || "0.00"}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Team Bonuses</p>
                                <p className="text-xl font-black">${data?.teamIncome || "0.00"}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Pool Rewards</p>
                                <p className="text-xl font-black">${data?.poolIncome || "0.00"}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Target Rewards</p>
                                <p className="text-xl font-black">${data?.milestoneIncome || "0.00"}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 3. Target Incentive Plan Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Target Incentive Plan</h3>
                    <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 cursor-help">
                        <span className="text-[10px] font-bold">i</span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest -mt-4">Reach milestones to unlock additional rewards</p>
                <div className="flex items-center gap-2 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20 rounded-2xl max-w-2xl">
                    <span className="text-lg">ℹ️</span>
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                        <span className="font-extrabold text-[#6C63FF]">2-Month Retention Policy:</span> Rewards are credited only after referred users remain active (unblocked with a valid plan) for at least <span className="font-extrabold text-[#6C63FF]">60 continuous days</span>.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data?.milestones?.map((m: any, idx: number) => {
                        const progress = Math.min((m.currentCount / m.targetCount) * 100, 100);
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-gray-100 dark:border-white/5 shadow-lg space-y-6 relative overflow-hidden"
                            >
                                {m.isClaimed && (
                                    <div className="absolute top-0 right-0 px-4 py-1 bg-[#4CAF50] text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl">
                                        Claimed
                                    </div>
                                )}
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-[#6C63FF] uppercase tracking-widest">Milestone {idx + 1}</p>
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white">₹{m.reward} <span className="text-xs font-bold text-slate-400">Reward</span></h4>
                                    </div>
                                    <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-[#6C63FF] border border-blue-100 dark:border-blue-800/50 rounded-full text-[8px] font-black uppercase tracking-widest">
                                        Retention Status: 60d
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                                        <div className="flex flex-col">
                                            <span className="text-slate-900 dark:text-white">{m.currentCount}/{m.targetCount} Users</span>
                                            <span className="text-[8px] text-slate-400 opacity-60">At least 2 months active</span>
                                        </div>
                                        <span className="text-slate-400">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-[#6C63FF] rounded-full"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                                        <span className="text-[10px] text-slate-400">🕒</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {m.currentCount >= m.targetCount
                                            ? "Eligibility met - Processing"
                                            : `${m.targetCount - m.currentCount} more users to reach target`}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* 4. Secondary Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Transaction History Table */}
                <div className="lg:col-span-12 bg-white dark:bg-slate-900 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Recent Clearances</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verification status of recent earnings</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/[0.02] text-[10px] uppercase text-slate-400 font-black tracking-widest">
                                    <th className="px-8 py-5">Source Detail</th>
                                    <th className="px-8 py-5">Date / Clock</th>
                                    <th className="px-8 py-5">Node Type</th>
                                    <th className="px-8 py-5 text-right">Settlement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {(!data?.recentTransactions || data.recentTransactions.length === 0) ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                                            No transaction data detected in nodes.
                                        </td>
                                    </tr>
                                ) : (
                                    data?.recentTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${tx.type === "CREDIT" ? "bg-[#4CAF50]/10 border-[#4CAF50]/10 text-[#4CAF50]" : "bg-red-50 text-red-400 border-red-100"}`}>
                                                        {tx.type === "CREDIT" ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm text-slate-900 dark:text-white leading-none mb-1">{tx.description}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">ID: #{tx.id.toString().slice(-6)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-slate-300 font-medium">Synced</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">{tx.category}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className={`text-sm font-black ${tx.type === "CREDIT" ? "text-[#4CAF50]" : "text-red-500"}`}>
                                                    {tx.type === "CREDIT" ? "+" : "-"}${tx.amount}
                                                </p>
                                                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">USDT</p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, description, color }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-gray-100 dark:border-white/5 shadow-lg space-y-4 hover:scale-[1.02] transition-transform">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'green' ? 'bg-[#4CAF50]/10 text-[#4CAF50]' : 'bg-[#6C63FF]/10 text-[#6C63FF]'}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black tracking-tight">{value}</h3>
            </div>
            <p className="text-[10px] text-slate-300 font-medium">{description}</p>
        </div>
    );
}
