"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
    Wallet,
    Users,
    Package,
    Code,
    Activity,
    Loader2,
    TrendingUp,
    ArrowUpRight,
    ShieldCheck,
    Zap,
    LayoutDashboard,
    ArrowRight,
    Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EarningsData } from "@/types/earnings";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Web3Payment from "@/components/Web3Payment";
import Link from "next/link";

export default function DashboardPage() {
    const { user: authUser } = useAuth();

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
        enabled: !!authUser?.uid,
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
        enabled: !!authUser?.uid,
    });

    const isLoading = userLoading || earningsLoading;
    const userData = userDataResponse?.user;

    if (isLoading) {
        return (
            <div className="flex flex-col h-[60vh] items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#6C63FF]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Hub...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 md:px-0">
            {/* 1. Welcome Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                        Welcome back, <span className="text-[#6C63FF]">{userData?.name?.split(' ')[0] || "User"}</span>! ✨
                    </h1>
                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                        <span>Your network is active and growing.</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-[#6C63FF]" />
                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Auth Valid</span>
                    </div>
                </div>
            </div>

            {/* 2. Highlight Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <OverviewCard
                    title="Wallet Balance"
                    value={`$${userData?.walletBalance || 0}`}
                    desc="Ready for withdrawal"
                    icon={<Wallet />}
                    color="text-emerald-500"
                    bg="bg-emerald-50"
                    darkBg="dark:bg-emerald-500/10"
                />
                <OverviewCard
                    title="Total Income"
                    value={`$${earningsData?.totalEarnings || 0}`}
                    desc="Lifetime earnings"
                    icon={<TrendingUp />}
                    color="text-[#6C63FF]"
                    bg="bg-blue-50"
                    darkBg="dark:bg-[#6C63FF]/10"
                />
                <OverviewCard
                    title="Team Nodes"
                    value={userData?.referrals?.length || 0}
                    desc="Personal referrals"
                    icon={<Users />}
                    color="text-purple-500"
                    bg="bg-purple-50"
                    darkBg="dark:bg-purple-500/10"
                />
                <OverviewCard
                    title="Network Plan"
                    value={userData?.plan?.name || "Inactive"}
                    desc={userData?.plan ? "Level 1 Active" : "Activation Required"}
                    icon={<Package />}
                    color="text-amber-500"
                    bg="bg-amber-50"
                    darkBg="dark:bg-amber-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* 3. Main Dashboard Interaction Area */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Activation/Referral Callout */}
                    {!userData?.plan ? (
                        <div className="bg-[#0F172A] rounded-[48px] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C63FF]/20 rounded-full blur-[100px] -mr-40 -mt-40" />
                            <div className="relative z-10 space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6C63FF]/20 rounded-full border border-[#6C63FF]/20 text-[#6C63FF] text-[9px] font-black uppercase tracking-widest">
                                            Action Required
                                        </div>
                                        <h2 className="text-3xl font-black">Plan Activation Required</h2>
                                        <p className="text-slate-400 text-sm font-medium max-w-sm leading-relaxed">
                                            To start earning referral income and join the global FIFO matrix, you must activate your network plan.
                                        </p>
                                    </div>
                                    <div className="md:w-64 flex-shrink-0">
                                        <Web3Payment onIdToken={() => authUser!.getIdToken()} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#6C63FF] rounded-[48px] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Your Exclusive Invite Code</p>
                                    <h2 className="text-6xl font-black tracking-tighter">{userData?.referralCode || "------"}</h2>
                                    <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all">
                                        Copy Link <ArrowRight size={14} />
                                    </button>
                                </div>
                                <div className="hidden md:block">
                                    <Sparkles size={120} className="opacity-10 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Performance Trends Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-gray-100 dark:border-white/5 shadow-xl space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black tracking-tighter">Live Network Pulse</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Performance of your downline hubs</p>
                            </div>
                            <Link href="/dashboard/network" className="text-xs font-black text-[#6C63FF] border-b-2 border-transparent hover:border-[#6C63FF] transition-all pb-1">Enter Full View</Link>
                        </div>

                        <div className="h-40 flex items-end gap-3 px-2">
                            {[50, 70, 40, 90, 60, 30, 80].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className="flex-1 bg-slate-50 dark:bg-white/5 rounded-t-2xl group relative"
                                >
                                    <div className="absolute inset-0 bg-[#6C63FF] opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* 4. Side Sidebar - Quick Stats / Recommendations */}
                <div className="lg:col-span-4 space-y-8">

                    <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-gray-100 dark:border-white/5 shadow-xl space-y-8">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Users size={24} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black tracking-tighter">Global Matrix</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                You are currently <span className="text-[#6C63FF] font-black">{Math.round(((earningsData?.autoPool?.filled || 0) / (earningsData?.autoPool?.total || 27)) * 100)}%</span> complete in the current global FIFO cycle.
                            </p>
                        </div>
                        <Link href="/dashboard/network" className="w-full py-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                            Explore Tree <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-gray-100 dark:border-white/5 shadow-xl space-y-8">
                        <div className="w-12 h-12 rounded-2xl bg-[#6C63FF]/10 flex items-center justify-center text-[#6C63FF]">
                            <LayoutDashboard size={24} />
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</p>
                            <div className="space-y-4">
                                {(!earningsData?.recentTransactions || earningsData.recentTransactions.length === 0) ? (
                                    <p className="text-xs font-bold text-slate-300 italic">Listening for node activity...</p>
                                ) : (
                                    earningsData.recentTransactions.slice(0, 3).map((tx: any) => (
                                        <div key={tx.id} className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate flex-1">{tx.description}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
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
