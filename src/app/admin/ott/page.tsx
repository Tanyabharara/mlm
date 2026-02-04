
"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Monitor,
    CheckCircle2,
    XCircle,
    Loader2,
    ShieldCheck,
    User,
    Mail,
    Calendar,
    ArrowRight,
    Edit3,
    Clock,
    Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminOttPage() {
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");

    // Fetch Pending OTT Requests
    const { data, isLoading } = useQuery({
        queryKey: ["admin", "ott", "pending"],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/admin/ott/pending", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch pending requests");
            return res.json();
        },
        enabled: !!authUser
    });

    // Approval Mutation
    const approveMutation = useMutation({
        mutationFn: async ({ subscriptionId, ottId, password, platform, action }: any) => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/admin/ott/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ subscriptionId, ottId, password, platform, action })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Action failed");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "ott", "pending"] });
            alert("Action processed successfully!");
        },
        onError: (err: any) => {
            alert(err.message);
        }
    });

    const requests = data?.requests || [];
    const filteredRequests = requests.filter((r: any) =>
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-24">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center">
                            <Monitor size={22} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase font-outfit">
                            OTT Access Approval
                        </h1>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        Administrative Control · Subscription Management
                    </p>
                </div>

                <div className="relative group max-w-md w-full">
                    <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 group-focus-within:text-purple-500 transition-colors">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[24px] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Pending Requests Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-premium overflow-hidden">
                <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <Clock className="text-amber-500" size={20} />
                        <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase font-outfit">
                            Pending Requests ({filteredRequests.length})
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-purple-600">
                        <ShieldCheck size={14} /> System Verified Payments
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.01] text-[10px] uppercase text-slate-400 font-black tracking-widest border-b border-gray-50 dark:border-white/5">
                                <th className="px-8 py-6">Partner Information</th>
                                <th className="px-8 py-6">Payment Reference</th>
                                <th className="px-8 py-6">OTT Configuration</th>
                                <th className="px-8 py-6 text-right">Verification Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="animate-spin text-purple-500" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading requests...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No pending approval requests found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req: any) => (
                                    <OttRequestRow
                                        key={req.id}
                                        request={req}
                                        onApprove={(data: any) => approveMutation.mutate({ ...data, subscriptionId: req.id, action: "APPROVE" })}
                                        onReject={() => approveMutation.mutate({ subscriptionId: req.id, action: "REJECT" })}
                                        isPending={approveMutation.isPending}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function OttRequestRow({ request, onApprove, onReject, isPending }: any) {
    const [ottId, setOttId] = useState(`OTT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    const [password, setPassword] = useState("123456");

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
            <td className="px-8 py-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                        {request.user?.name?.charAt(0) || "U"}
                    </div>
                    <div className="space-y-1">
                        <p className="font-black text-sm text-slate-900 dark:text-white font-outfit tracking-tight">{request.user?.name || "Unknown Partner"}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <Mail size={12} /> {request.user?.email}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-8 py-8">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600">
                        Verified Payment
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-100 dark:border-white/5 truncate max-w-[150px]">
                        ID: {request.paymentIntentId || "Direct Activation"}
                    </p>
                </div>
            </td>
            <td className="px-8 py-8">
                <div className="space-y-4 max-w-[200px]">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Assignment ID</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={ottId}
                                onChange={(e) => setOttId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-black focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <Edit3 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Access Key</label>
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-black focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                    </div>
                </div>
            </td>
            <td className="px-8 py-8 text-right">
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onReject}
                        disabled={isPending}
                        className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all disabled:opacity-50"
                    >
                        <XCircle size={20} />
                    </button>
                    <button
                        onClick={() => onApprove({ ottId, password })}
                        disabled={isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? "Syncing..." : <>Approve Access <CheckCircle2 size={16} /></>}
                    </button>
                </div>
            </td>
        </tr>
    );
}
