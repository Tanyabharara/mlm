"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
    Wallet,
    Users,
    Activity,
    Loader2,
    ShieldCheck,
    Zap,
    LayoutDashboard,
    ArrowRight,
    Sparkles,
    Globe,
    CheckCircle2,
    Lock,
    Trophy,
    ExternalLink,
    PlusCircle,
    Monitor,
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EarningsData } from "@/types/earnings";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const [mounted, setMounted] = React.useState(false);
    const { user: authUser } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // User Data Query
    const { data: userDataResponse, isLoading: userLoading } = useQuery({
        queryKey: ["user", authUser?.uid],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/user/me", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ uid: authUser!.uid }),
            });
            return res.json();
        },
        enabled: !!authUser?.uid && mounted,
    });

    // Earnings Data Query
    const { data: earningsData, isLoading: earningsLoading } = useQuery<EarningsData>({
        queryKey: ["earnings", authUser?.email],
        queryFn: async () => {
            const response = await fetch("/api/user/earnings", {
                headers: {
                    "x-user-email": authUser?.email || "",
                    Authorization: `Bearer ${await authUser!.getIdToken()}`,
                },
            });
            return response.json();
        },
        enabled: !!authUser?.uid && mounted,
    });

    const isLoading = userLoading || earningsLoading;
    const userData = userDataResponse?.user;

    // OTT Data Query
    const { data: ottData } = useQuery({
        queryKey: ["user", "ott", authUser?.uid],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/user/ott", {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        enabled: !!authUser?.uid && mounted,
    });

    const activeOtt = ottData?.subscriptions?.find((s: any) => s.status === "ACTIVE");

    // Redirect to activation if no plan
    React.useEffect(() => {
        if (!isLoading && userData && !userData.plan) {
            router.push("/dashboard/activate");
        }
    }, [userData, isLoading, router]);

    if (!mounted) return null;

    if (isLoading) {
        return (
            <div className="flex flex-col h-[60vh] items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#6C63FF]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Hub...</p>
            </div>
        );
    }

    if (!userData?.plan) return null; // Let the redirect handle it

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 md:px-0 font-sans">
            {/* 1. Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white font-outfit uppercase tracking-tight flex items-center gap-2">
                        Partner Overview
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Account Active</span>
                    </div>
                </div>
            </div>

            {/* 2. Welcome Banner */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                        Welcome back, <span className="text-[#6C63FF]">{userData?.name || "User"}</span>! ✨
                    </h2>
                    <p className="text-blue-500 font-bold text-sm">
                        Stream, Share & Earn: Your Journey to Financial Freedom Starts Here.
                    </p>
                </div>
                <p className="text-slate-400 font-medium text-xs max-w-2xl leading-relaxed">
                    Your premium subscription is active. Here's your portfolio performance.
                </p>
            </div>

            {/* 3. Main Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Card 1: Wallet Balance */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-premium flex flex-col justify-between space-y-12">
                    <div className="flex justify-between items-start">
                        <div className="w-14 h-14 rounded-2xl bg-[#6C63FF]/10 flex items-center justify-center text-[#6C63FF]">
                            <Wallet size={28} />
                        </div>
                        <button className="px-6 py-2.5 bg-[#6C63FF]/10 hover:bg-[#6C63FF]/20 text-[#6C63FF] rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
                            Withdraw Funds
                        </button>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Withdrawable Balance</p>
                        <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                            ${userData?.walletBalance || "0.00"}
                        </h3>
                    </div>
                </div>

                {/* Card 2: OTT Access */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-premium flex flex-col justify-between space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <Monitor size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black font-outfit text-slate-900 dark:text-white uppercase tracking-wider">
                                {activeOtt ? activeOtt.platform : "OTT Access"}
                            </h4>
                            <p className="text-[10px] font-bold text-[#6C63FF] uppercase tracking-widest leading-none">
                                {activeOtt ? "Active • Premium" : "Pending • Lifetime"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activeOtt ? (
                            <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>User</span>
                                    <span className="text-slate-900 dark:text-white lowercase">{activeOtt.username || "n/a"}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Key</span>
                                    <span className="text-slate-900 dark:text-white font-mono">{activeOtt.password ? "••••••••" : "n/a"}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300">
                                        {i === 1 ? <Zap size={18} className="text-amber-500" /> : <Lock size={16} />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-slate-50 dark:border-white/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {activeOtt ? "Access Secured" : "Awaiting Approval"}
                        </p>
                        <button
                            onClick={() => activeOtt && alert(`Access Link: ${activeOtt.link || 'Please use login details.'}`)}
                            className="text-[10px] font-black text-[#6C63FF] uppercase tracking-widest hover:underline"
                        >
                            {activeOtt ? "View Portal" : "Check Status"}
                        </button>
                    </div>
                </div>

                {/* Card 3: Milestone Tracker - Replaces Incentive Targets */}
                <div className="md:col-span-2 bg-slate-50 dark:bg-white/[0.02] rounded-[48px] p-2 border border-slate-100 dark:border-white/5 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {earningsData?.milestones?.map((m: any, idx: number) => {
                            const progress = Math.min((m.currentCount / m.targetCount) * 100, 100);
                            const remaining = Math.max(m.targetCount - m.currentCount, 0);

                            return (
                                <div key={idx} className="bg-white dark:bg-slate-900 rounded-[40px] p-8 space-y-6 border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-black font-outfit uppercase tracking-tighter text-slate-900 dark:text-white">Milestone {idx + 1}</h4>
                                            <p className="text-2xl font-black text-[#6C63FF] tracking-tighter">${m.reward.toFixed(2)} Reward</p>
                                        </div>
                                        <div className={`p-2 rounded-xl ${m.isClaimed ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"}`}>
                                            {m.isClaimed ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Retention Status</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">0d</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verification</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{m.currentCount}/{m.targetCount} Verified</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Growth</p>
                                                <p className="text-xs font-bold text-emerald-500">Retained</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Node Status</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{m.currentCount} Active Nodes</p>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${m.isClaimed ? "text-emerald-500" : "text-amber-500"}`}>
                                                    {m.isClaimed ? "Distributed ✓" : "Pending"}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-900 dark:text-white font-mono">{progress.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${m.isClaimed ? "bg-emerald-500" : "bg-amber-400"}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50 dark:border-white/5">
                                        <span className="text-[14px]">🕒</span>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                            {remaining > 0 ? `${remaining} more users to reach target` : "Target achieved! Reward credited."}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Card 4: Auto Pool Rules */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-premium flex flex-col justify-between space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#6C63FF]/10 flex items-center justify-center text-[#6C63FF]">
                                <Activity size={24} />
                            </div>
                            <h4 className="text-sm font-black font-outfit text-slate-900 dark:text-white uppercase tracking-wider">Passive Growth Plan</h4>
                        </div>
                        <div className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-1.5 grayscale opacity-50">
                            <Zap size={10} fill="currentColor" />
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">Global Pool</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l-2 border-[#6C63FF] pl-4 italic">
                            This pool represents your second system income which will be fully functional in the next update.
                        </p>
                        <div className="space-y-3 pt-2">
                            {[
                                "System managed spill-over logic",
                                "Auto-placement after plan activation",
                                "Income generated through global volume",
                                "No referral dependency for basic pool",
                                "Pool structure hidden for system stability",
                                "Reward payout directly to partner wallet"
                            ].map((text, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#6C63FF] shrink-0" />
                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight leading-tight">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Direct Incentive Plan (Referrals List) */}
            <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-premium overflow-hidden">
                <div className="p-10 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Direct Incentive Plan</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time referral activation tracking</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Paid</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-500/10 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[8px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest">Pending</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] text-[10px] uppercase text-slate-400 font-black tracking-widest">
                                <th className="px-10 py-5">Partner Name</th>
                                <th className="px-10 py-5">Email Address</th>
                                <th className="px-10 py-5">Joined Date</th>
                                <th className="px-10 py-5 text-right">Payment Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {(!userData?.referrals || userData.referrals.length === 0) ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                                        No linked partners in your direct circle yet.
                                    </td>
                                </tr>
                            ) : (
                                userData.referrals.map((ref: any) => (
                                    <tr key={ref.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-xs ${ref.planId ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                                                    {ref.name?.charAt(0) || "U"}
                                                </div>
                                                <p className="font-black text-sm text-slate-900 dark:text-white">{ref.name || "Anonymous User"}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-xs text-slate-400 font-medium lowercase">
                                            {ref.email}
                                        </td>
                                        <td className="px-10 py-6 text-xs font-bold text-slate-600 dark:text-slate-400">
                                            {new Date(ref.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${ref.planId
                                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 shadow-sm"
                                                : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20 opacity-60 group-hover:opacity-100"}`}>
                                                {ref.planId ? "Settled ✓" : "Awaiting Pay"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Float Action - Invite Link */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-50">
                <div className="bg-slate-900 text-white rounded-[40px] p-6 shadow-2xl flex items-center justify-between gap-6 border border-white/10 backdrop-blur-md bg-slate-900/90">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Your Invitation Code</p>
                        <p className="text-xl font-black font-outfit tracking-widest text-[#6C63FF]">{userData?.referralCode || "------"}</p>
                    </div>
                    <button className="h-12 px-8 bg-[#6C63FF] hover:bg-[#5B52E5] text-white rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2">
                        Get Invite Link <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function RuleStep({ number, text }: { number: string; text: string }) {
    return (
        <div className="flex items-start gap-4">
            <span className="text-[#6C63FF] text-[10px] font-black font-outfit pt-0.5">{number}</span>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tighter">{text}</p>
        </div>
    );
}

function OverviewCard({ title, value, desc, icon, color, bg, darkBg }: any) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-xl space-y-6"
        >
            <div className={`w-12 h-12 rounded-2xl ${bg} ${darkBg} ${color} flex items-center justify-center`}>
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{value}</h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{desc}</p>
        </motion.div>
    );
}
