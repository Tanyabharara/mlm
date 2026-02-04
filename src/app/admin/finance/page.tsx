"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    TrendingUp,
    Save,
    RefreshCcw,
    ShieldCheck,
    Edit3,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Info,
    Wallet,
    DollarSign,
    Percent,
    ArrowRight,
    Monitor,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    History
} from "lucide-react";
import { motion } from "framer-motion";
import { notFound } from "next/navigation";

export default function AdminFinancePage() {
    const { user: authUser, userData, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const [percentages, setPercentages] = useState<Record<string, number>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 10;

    // Fetch Configs
    const { data: financeData, isLoading: financeLoading } = useQuery({
        queryKey: ["admin", "level-income-config"],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/admin/config/finance", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Unauthorized");
            const result = await res.json();
            setPercentages(result.percentages);
            return result;
        },
        enabled: !!authUser && userData?.role === 'ADMIN'
    });

    const [platformConfig, setPlatformConfig] = useState({
        treasuryAddress: '',
        planPrice: '600'
    });

    const { data: platformData, isLoading: platformLoading } = useQuery({
        queryKey: ["admin", "platform-config"],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/admin/config", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            setPlatformConfig(result.config || { treasuryAddress: '', planPrice: '600' });
            return result;
        },
        enabled: !!authUser && userData?.role === 'ADMIN'
    });

    const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
        queryKey: ["admin", "recent-payments", page],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch(`/api/admin/payments/recent?page=${page}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        enabled: !!authUser && userData?.role === 'ADMIN'
    });

    const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
        queryKey: ["admin", "all-transactions"],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch(`/api/admin/transactions?limit=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        enabled: !!authUser && userData?.role === 'ADMIN'
    });

    const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
        queryKey: ["admin", "withdrawals"],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/admin/withdrawals", {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        enabled: !!authUser && userData?.role === 'ADMIN'
    });

    const withdrawalMutation = useMutation({
        mutationFn: async ({ withdrawalId, action }: any) => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/admin/withdrawals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ withdrawalId, action })
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (data.error) alert(data.error);
            else {
                queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "all-transactions"] });
                alert("Action completed! 🚀");
            }
        }
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async () => {
            const token = await authUser!.getIdToken();

            // Save Finance Config
            await fetch("/api/admin/config/finance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ percentages })
            });

            // Save Platform Config
            await fetch("/api/admin/config", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(platformConfig)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin"] });
            setIsDirty(false);
            alert("All configurations saved successfully! 🚀");
        }
    });

    const handlePercentageChange = (level: string, value: string) => {
        const numValue = parseFloat(value) / 100; // UI is in %, but storage is decimal (0.10)
        if (isNaN(numValue)) return;
        setPercentages(prev => ({ ...prev, [level]: numValue }));
        setIsDirty(true);
    };

    // --- PROTECTIVE UI ---
    if (authLoading || (authUser && !userData)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 animate-spin text-[#6C63FF]" />
            </div>
        );
    }

    if (userData?.role !== 'ADMIN') {
        return notFound();
    }

    if (financeLoading || platformLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <Loader2 className="w-10 h-10 animate-spin text-[#6C63FF]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#6C63FF] rounded-lg flex items-center justify-center text-white">
                                <TrendingUp size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-[#6C63FF]">Financial Control</span>
                        </div>
                        <h1 className="text-4xl font-black font-outfit tracking-tight text-slate-900 dark:text-white uppercase">Finance Dashboard</h1>
                        <p className="text-slate-500 font-medium">Monitor revenue streams and split fund allocations.</p>
                    </div>

                    <button
                        onClick={() => updateMutation.mutate()}
                        disabled={!isDirty || updateMutation.isPending}
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl
                            ${isDirty
                                ? "bg-[#6C63FF] text-white hover:bg-[#5B52E5] active:scale-95"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"}
                        `}
                    >
                        {updateMutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                        Save Config
                    </button>
                </div>

                {/* Financial Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Wallet 1: Total Collected */}
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
                        <div className="flex items-center gap-2 relative z-10">
                            <Wallet size={16} className="text-[#6C63FF]" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Collection</span>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black font-outfit tracking-tighter relative z-10">
                                ${paymentsData?.totalCollected?.toFixed(2) || "0.00"}
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Lifetime Gross Revenue</p>
                        </div>
                    </div>

                    {/* Wallet 2: OTT Service Fund */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-8 rounded-[40px] space-y-4 shadow-premium group">
                        <div className="flex items-center gap-2">
                            <Monitor size={16} className="text-purple-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">OTT Service Fund</span>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black font-outfit tracking-tighter text-slate-900 dark:text-white">
                                ${paymentsData?.totalOttFund?.toFixed(2) || "0.00"}
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">$5.00 Allocated per User</p>
                        </div>
                    </div>

                    {/* Wallet 3: Platform Pool */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-8 rounded-[40px] space-y-4 shadow-premium group">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Platform Pool</span>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black font-outfit tracking-tighter text-slate-900 dark:text-white">
                                ${paymentsData?.totalPlatformPool?.toFixed(2) || "0.00"}
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">$1.00 Allocated per User</p>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 rounded-3xl flex gap-4 items-center">
                    <AlertCircle className="text-amber-500" size={24} />
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400 leading-tight">
                        Allocation Rule: Every $6.00 payment is automatically split into <span className="underline font-black">$5.00 for OTT Service</span> and <span className="underline font-black">$1.00 for the platform pool</span>.
                    </p>
                </div>

                {/* Treasury Config Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 p-8 shadow-sm space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/10 flex items-center justify-center text-[#6C63FF]">
                            <Wallet size={20} />
                        </div>
                        <h3 className="text-2xl font-black font-outfit tracking-tight text-slate-900 dark:text-white uppercase">Treasury Wallet</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination Address (USDT BSC)</label>
                            <input
                                placeholder="0x..."
                                value={platformConfig.treasuryAddress}
                                onChange={(e) => {
                                    setPlatformConfig({ ...platformConfig, treasuryAddress: e.target.value });
                                    setIsDirty(true);
                                }}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl outline-none font-mono text-sm font-bold focus:ring-4 focus:ring-[#6C63FF]/10 transition-all"
                            />
                            {platformConfig.treasuryAddress && (
                                <a
                                    href={`https://bscscan.com/address/${platformConfig.treasuryAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#6C63FF] uppercase tracking-widest hover:underline mt-2 ml-1"
                                >
                                    <Info size={12} /> View on BscScan
                                </a>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Price (USDT)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={platformConfig.planPrice}
                                    onChange={(e) => {
                                        setPlatformConfig({ ...platformConfig, planPrice: e.target.value });
                                        setIsDirty(true);
                                    }}
                                    className="w-full pl-10 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl outline-none text-xl font-black focus:ring-4 focus:ring-[#6C63FF]/10 transition-all"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <DollarSign size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Percent className="text-[#6C63FF]" size={20} />
                        <h2 className="text-xl font-black font-outfit uppercase tracking-tight">Reward Matrix</h2>
                    </div>
                    {/* Levels Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.keys(percentages).sort((a, b) => parseInt(a) - parseInt(b)).map((level) => (
                            <motion.div
                                key={level}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 p-8 flex items-center justify-between group hover:border-[#6C63FF]/30 transition-all shadow-sm"
                            >
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6C63FF]">Level</span>
                                    <h3 className="text-3xl font-black font-outfit text-slate-900 dark:text-white">#{level}</h3>
                                </div>

                                <div className="relative group/input">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={(percentages[level] * 100).toFixed(2)}
                                        onChange={(e) => handlePercentageChange(level, e.target.value)}
                                        className="w-32 pr-10 pl-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xl font-black text-right focus:ring-4 focus:ring-[#6C63FF]/10 transition-all"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Pending Withdrawal Requests Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                <ArrowDownRight size={20} />
                            </div>
                            <h3 className="text-2xl font-black font-outfit tracking-tight text-slate-900 dark:text-white uppercase">Waitlisted Payouts</h3>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-50 dark:border-white/5">
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User / Identity</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Net Amount</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Request Time</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Clearance Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {withdrawalsData?.withdrawals?.filter((w: any) => w.status === "PENDING").map((w: any) => (
                                    <tr key={w.id} className="group">
                                        <td className="py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{w.user?.name || "Unknown User"}</span>
                                                <span className="text-[10px] font-black text-[#6C63FF] uppercase tracking-widest opacity-60">{w.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-sm font-black text-red-500">${Number(w.amount).toFixed(2)}</span>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(w.createdAt).toLocaleString()}</span>
                                        </td>
                                        <td className="py-6 text-right space-x-2">
                                            <button
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to reject this withdrawal? The balance will be refunded.")) {
                                                        withdrawalMutation.mutate({ withdrawalId: w.id, action: "REJECT" });
                                                    }
                                                }}
                                                disabled={withdrawalMutation.isPending}
                                                className="px-4 py-2 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Confirm payment of $${Number(w.amount).toFixed(2)} to ${w.user?.name}?`)) {
                                                        withdrawalMutation.mutate({ withdrawalId: w.id, action: "APPROVE" });
                                                    }
                                                }}
                                                disabled={withdrawalMutation.isPending}
                                                className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
                                            >
                                                Approve & Pay
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!withdrawalsData?.withdrawals || withdrawalsData.withdrawals.filter((w: any) => w.status === "PENDING").length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-slate-300 font-bold text-xs uppercase tracking-widest italic">
                                            No pending payout clearances found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Payments Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <RefreshCcw size={20} />
                            </div>
                            <h3 className="text-2xl font-black font-outfit tracking-tight text-slate-900 dark:text-white uppercase">Recent Settlement Activity</h3>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-50 dark:border-white/5">
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Transaction</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {paymentsData?.payments?.map((payment: any) => (
                                    <tr key={payment.id} className="group">
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {payment.user?.name || "Anonymous User"}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    {payment.user?.email || "No email available"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="text-sm font-black text-[#6C63FF]">${payment.amount}</span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                                                ${payment.status === 'VERIFIED' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}
                                            `}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className="text-xs text-slate-400 font-medium">{new Date(payment.createdAt).toLocaleDateString()}</span>
                                        </td>
                                        <td className="py-4 text-right">
                                            {payment.txHash ? (
                                                <a
                                                    href={`https://bscscan.com/tx/${payment.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-[#6C63FF] transition-colors"
                                                >
                                                    EXPLORE <ArrowRight size={12} />
                                                </a>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300">NO TX HASH</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {paymentsData?.totalPages > 1 && (
                        <div className="pt-6 flex items-center justify-between border-t border-slate-50 dark:border-white/5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                Page {page} of {paymentsData.totalPages} ({paymentsData.totalCount} total)
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-slate-100"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(paymentsData.totalPages, p + 1))}
                                    disabled={page === paymentsData.totalPages}
                                    className="px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-slate-100"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Global Transaction Ledger */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <History size={20} />
                            </div>
                            <h3 className="text-2xl font-black font-outfit tracking-tight text-slate-900 dark:text-white uppercase">Global Transaction Ledger</h3>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-50 dark:border-white/5">
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User / Wallet</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {transactionsData?.transactions?.map((tx: any) => (
                                    <tr key={tx.id} className="group">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.displayType === 'CREDIT' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {tx.displayType === 'CREDIT' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {tx.description || "System Transaction"}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        ID: {tx.id.slice(-8)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {tx.user?.name || "System"}
                                                </span>
                                                <span className="text-[10px] font-black text-[#6C63FF] uppercase tracking-widest">
                                                    Source: {tx.category || "General"} Wallet
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                                                ${tx.displayType === 'CREDIT' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}
                                            `}>
                                                {tx.displayType}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`text-sm font-black ${tx.displayType === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                                                {tx.displayType === 'CREDIT' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!transactionsData?.transactions || transactionsData.transactions.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest italic">
                                            No transaction data available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
                        <ShieldCheck size={14} /> System Secure • Admin Access Only
                    </p>
                </div>
            </div>
        </div>
    );
}
