"use client";

import React from "react";
import {
    ShieldCheck,
    ArrowRight,
    Zap,
    Info,
    AlertTriangle,
    TrendingUp,
    Clock,
    Gem,
    Users,
    ChevronDown,
    XCircle,
    CheckCircle2,
    DollarSign
} from "lucide-react";
import { motion } from "framer-motion";

export default function AutoPoolPage() {
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in duration-700 pb-24">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#6C63FF]/10 text-[#6C63FF] rounded-lg flex items-center justify-center">
                            <Zap size={18} fill="currentColor" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase font-outfit">
                            Auto Pool Income Plan
                        </h1>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        Autonomous Financial Distribution · Managed Assets
                    </p>
                </div>
                <div className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hidden md:flex items-center gap-2">
                    <ShieldCheck size={14} /> System Verified
                </div>
            </div>

            {/* Income Card Description Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-12 bg-white dark:bg-slate-900 rounded-[48px] p-8 md:p-14 border border-gray-100 dark:border-white/5 shadow-2xl space-y-12 overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#6C63FF]/5 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none" />

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 items-start">
                        {/* Information List */}
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <span className="px-3 py-1 bg-[#6C63FF]/10 text-[#6C63FF] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#6C63FF]/20">
                                    CORE MECHANICS
                                </span>
                                <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Dynamic Global <br /><span className="text-[#6C63FF]">Reward Distribution</span>
                                </h2>
                            </div>

                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                <DescriptionItem text="Auto Pool is time-based and company-managed" />
                                <DescriptionItem text="Users are auto-placed after plan activation" />
                                <DescriptionItem text="Income is generated automatically" />
                                <DescriptionItem text="No manual work required" />
                                <DescriptionItem text="No referral dependency" />
                                <DescriptionItem text="Pool structure and placements are not visible" />
                                <DescriptionItem text="Earnings credited directly to wallet when applicable" />
                            </ul>
                        </div>

                        {/* Visual Rules Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <RewardCard level="LEVEL 1" percentage="10%" label="Initial Yield" color="#6C63FF" />
                            <RewardCard level="LEVEL 2" percentage="20%" label="Growth Phase" color="#4CAF50" />
                            <RewardCard level="LEVEL 3" percentage="30%" label="Peak Maturity" color="#FFD700" />

                            <div className="md:col-span-3 p-6 bg-slate-50 dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-white/5 space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp size={14} /> System Logic
                                </p>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                    After completion, users are <span className="text-[#6C63FF] font-bold">automatically shifted</span> to the next pool tier. This execution is handled entirely by the systemic arbiter logic.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Comparison Table Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-outfit">Pool Income Tiers</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-[#4CAF50] uppercase tracking-widest bg-[#4CAF50]/10 px-3 py-1 rounded-full">
                        <DollarSign size={12} /> Live Settlement Estimates
                    </div>
                </div>

                <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5">
                                <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Pool Tier</th>
                                <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Entry Stake</th>
                                <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400">L1 - L2 - L3 Rewards</th>
                                <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Total Net Yield</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {[
                                { id: 1, fee: 1, l1: 0.3, l2: 1.8, l3: 8.1, total: 10.2, next: "Auto Shift to Pool 2" },
                                { id: 2, fee: 10, l1: 3, l2: 18, l3: 81, total: 102, next: "Auto Shift to Pool 3" },
                                { id: 3, fee: 100, l1: 30, l2: 180, l3: 810, total: 1020, next: "Ecosystem Mastery" }
                            ].map((pool) => (
                                <tr key={pool.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="p-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#6C63FF]/10 group-hover:text-[#6C63FF] transition-colors">
                                                <Gem size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tighter text-lg">Auto Pool {pool.id}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{pool.next}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <p className="font-black text-slate-500 text-xl font-outfit">${pool.fee}</p>
                                    </td>
                                    <td className="p-8">
                                        <div className="flex items-center gap-4">
                                            <RewardPill amount={pool.l1} level="L1" />
                                            <ArrowRight size={14} className="text-slate-200" />
                                            <RewardPill amount={pool.l2} level="L2" />
                                            <ArrowRight size={14} className="text-slate-200" />
                                            <RewardPill amount={pool.l3} level="L3" />
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <p className="font-black text-[#4CAF50] text-2xl font-outfit tracking-tighter group-hover:scale-105 transition-transform origin-left">
                                            ${pool.total.toLocaleString()}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RESTRICTION WARNING - GHOST MODE */}
            <div className="bg-amber-50 dark:bg-amber-500/5 rounded-[40px] p-10 border border-amber-100 dark:border-amber-500/10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <AlertTriangle size={120} className="text-amber-500" />
                </div>
                <div className="w-14 h-14 bg-amber-500 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                    <XCircle size={32} />
                </div>
                <div className="space-y-4 relative z-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Confidentiality Protocol Active</h4>
                    <p className="text-sm font-medium text-amber-700/80 leading-relaxed max-w-2xl">
                        To maintain system integrity and global synchronization, all <span className="font-black uppercase">Tree Views, Position Info, Level Progress, and Entry/Exit Controls</span> are intentionally restricted. Participation is managed entirely by the autonomous executive logic.
                    </p>
                </div>
            </div>

            {/* Footer Rules List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2 font-medium text-slate-400 text-xs">
                <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] mt-1.5 shrink-0" />
                    <p>Pool execution is governed by a first-come first-served global queue timestamp.</p>
                </div>
                <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] mt-1.5 shrink-0" />
                    <p>Earnings are automatically credited to the unified settlement wallet upon node fulfillment.</p>
                </div>
            </div>
        </div>
    );
}

function DescriptionItem({ text }: { text: string }) {
    return (
        <li className="flex items-start gap-3 group">
            <div className="w-5 h-5 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={14} />
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {text}
            </p>
        </li>
    );
}

function RewardCard({ level, percentage, label, color }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-8 rounded-[40px] text-center space-y-3 shadow-xl hover:translate-y-[-4px] transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{level}</p>
            <h4 className="text-5xl font-black font-outfit" style={{ color }}>{percentage}</h4>
            <div className="pt-2">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{label}</p>
            </div>
        </div>
    );
}

function RewardPill({ amount, level }: { amount: number; level: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{level}</span>
            <div className="px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/5 text-xs font-black text-slate-600 dark:text-slate-300">
                ${amount}
            </div>
        </div>
    );
}
