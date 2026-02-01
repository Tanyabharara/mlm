"use client";

import React from "react";
import { ShieldCheck, ArrowRight, Info, AlertTriangle, Users, TrendingUp, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AutoPoolRulesPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] p-6 md:p-12 lg:p-20 flex flex-col items-center">
            {/* Header / Logo Area */}
            <div className="w-full max-w-5xl flex items-center justify-between mb-16">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900">
                        <ShieldCheck size={24} />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white font-outfit uppercase">FinPool</span>
                </div>
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition-colors">Dashboard</Link>
                    <Link href="#" className="text-slate-900 dark:text-white underline decoration-2 underline-offset-8">Pool Rules</Link>
                    <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Support</Link>
                </div>
            </div>

            {/* Main Content Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-2xl p-10 md:p-16 space-y-16"
            >
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                        <Info size={32} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-outfit">
                            Auto Pool Rules & Disclaimer
                        </h1>
                        <p className="text-slate-400 text-sm font-medium italic underline underline-offset-4 decoration-slate-200 dark:decoration-white/10">
                            This section is for informational purposes only. Auto-pool placements are managed by the internal system logic.
                        </p>
                    </div>
                </div>

                {/* Queue Management Section */}
                <div className="space-y-12">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4CAF50]/10 rounded-full border border-[#4CAF50]/20 text-[#4CAF50] text-[10px] font-black uppercase tracking-widest">
                            <Zap size={12} fill="currentColor" /> SYSTEM MANAGED LOGIC
                        </div>
                        <h2 className="text-3xl font-black font-outfit text-slate-900 dark:text-white uppercase tracking-tight">Autonomous Queue Management</h2>
                        <p className="text-slate-500 max-w-2xl text-sm leading-relaxed">
                            To ensure absolute fairness, all placements within the Auto Pools are handled automatically by our time-based algorithm. Placements follow a strict 3x3 matrix structure.
                        </p>
                    </div>

                    {/* Comparison Table */}
                    <div className="overflow-hidden bg-slate-50 dark:bg-white/5 rounded-[40px] border border-gray-100 dark:border-white/5">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5">
                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Pool Tier</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Entry Fee (USDT)</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Reward</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Upgrade Path</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {[
                                    { id: 1, fee: 1, reward: 10.2, next: "Pool 2" },
                                    { id: 2, fee: 10, reward: 102, next: "Pool 3" },
                                    { id: 3, fee: 100, reward: 1020, next: "Max Tier" }
                                ].map((pool) => (
                                    <tr key={pool.id} className="group hover:bg-white dark:hover:bg-white/5 transition-colors">
                                        <td className="p-8">
                                            <p className="font-black text-slate-900 dark:text-white font-outfit uppercase">Auto Pool {pool.id}</p>
                                        </td>
                                        <td className="p-8">
                                            <p className="font-black text-[#6C63FF] text-xl font-outfit">${pool.fee}</p>
                                        </td>
                                        <td className="p-8">
                                            <p className="font-black text-[#4CAF50] text-xl font-outfit">${pool.reward}</p>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-full w-fit">
                                                <TrendingUp size={12} className="text-slate-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{pool.next}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <RewardCard level="LEVEL 1" percentage="10%" nodes="3 Total Nodes" />
                        <RewardCard level="LEVEL 2" percentage="20%" nodes="9 Total Nodes" />
                        <RewardCard level="LEVEL 3" percentage="30%" nodes="27 Total Nodes" />
                    </div>
                </div>

                {/* Mechanics List */}
                <div className="space-y-6 bg-slate-50 dark:bg-white/5 p-8 rounded-[32px]">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <TrendingUp size={14} /> Pool Mechanics & Logic
                    </h3>
                    <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <li className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                            Placements are executed based on a global "First-In, First-Out" (FIFO) timestamp sequence.
                        </li>
                        <li className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                            The system automatically calculates and distributes commissions to the eligible uplink wallets immediately upon node fulfillment.
                        </li>
                        <li className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                            Auto-upgrade to higher pools (e.g., Pool 2, Pool 3) is triggered automatically once the defined threshold of the current pool is reached.
                        </li>
                    </ul>
                </div>

                {/* Disclaimer */}
                <div className="space-y-6 border-t border-slate-100 dark:border-white/5 pt-10">
                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                        <AlertTriangle size={14} /> IMPORTANT DISCLAIMER
                    </h3>
                    <p className="text-xs font-medium text-slate-400 leading-relaxed text-justify">
                        The Auto Pool is an internal system-managed incentive structure. Individual progress views (progress bars, member nodes, and tree maps) are intentionally restricted to prevent manipulation and ensure global synchronization. Participation in the Auto Pool does not guarantee fixed returns; all earnings are strictly performance-based according to the referral tree growth and global system queue. By participating, users acknowledge that pool mechanics are governed by automated arbiter logic which is final and binding.
                    </p>
                </div>

                {/* Action */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all"
                >
                    Acknowledge & Return to Dashboard
                </button>
            </motion.div>

            {/* Footer */}
            <div className="mt-16 text-[10px] font-black uppercase tracking-widest text-slate-400 space-y-4 text-center">
                <p>© 2024 FinPool Systems • Secure & Transparent Distribution Logic</p>
                <div className="flex justify-center gap-6">
                    <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link>
                    <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
                    <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact Ethics Team</Link>
                </div>
            </div>
        </div>
    );
}

function RewardCard({ level, percentage, nodes }: { level: string; percentage: string; nodes: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-8 rounded-[32px] text-center space-y-3 shadow-lg shadow-slate-200/50 dark:shadow-none">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{level}</p>
            <h4 className="text-4xl font-black font-outfit text-slate-900 dark:text-white">{percentage}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{nodes}</p>
        </div>
    );
}
