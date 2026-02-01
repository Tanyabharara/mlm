"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
    Users,
    User as UserIcon,
    Crown,
    Loader2,
    Sparkles as SparklesIcon,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    Send,
    Plus,
    Minus,
    Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkPage() {
    const { user: authUser, userData } = useAuth();
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);

    const handleInvite = (code: string) => {
        const url = `${window.location.origin}/?ref=${code}`;
        navigator.clipboard.writeText(url);
        setCopyStatus(code);
        setTimeout(() => setCopyStatus(null), 3000);
    };

    // Fetch Network Data
    const { data: networkData, isLoading: networkLoading } = useQuery({
        queryKey: ["network", authUser?.uid],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/network", {
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

    if (networkLoading) {
        return (
            <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#6C63FF]" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Rendering Hubs...</p>
            </div>
        );
    }

    const members = networkData?.nodes || [];
    const rootUser = members.find((m: any) => m.data?.isRoot);
    const children = members.filter((m: any) => !m.data?.isRoot);

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">Network Tree</h1>
                    <p className="text-slate-400 font-medium">Visualize and manage your multi-level community hubs 🌐</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => userData?.referralCode && handleInvite(userData.referralCode)}
                        className="px-6 py-3 bg-[#6C63FF] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#6C63FF]/20 flex items-center gap-2 hover:bg-[#5B52E5] transition-all active:scale-95"
                    >
                        {copyStatus === userData?.referralCode ? "Link Copied! ✅" : "Send Invitation"}
                        <Send size={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">

                {/* 1. Main Canvas (The Tree) */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-xl relative overflow-x-auto lg:overflow-hidden flex flex-col items-center p-10 min-h-[500px]">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.01]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                    {/* Canvas Controls */}
                    <div className="absolute bottom-10 right-10 flex gap-2 z-20">
                        <div className="flex flex-col gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-white/5">
                            <button className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors"><Plus size={16} /></button>
                            <button className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors"><Minus size={16} /></button>
                            <button className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors border-t border-gray-100 dark:border-white/5"><Maximize2 size={16} /></button>
                        </div>
                    </div>

                    {/* Interactive Tree Root */}
                    <AnimatePresence>
                        <div className="relative z-10 w-full flex flex-col items-center py-10 min-w-[800px]">
                            {/* Root Node */}
                            <div className="relative mb-32">
                                {rootUser && (
                                    <NodeCard
                                        user={rootUser}
                                        isRoot
                                        onClick={() => setSelectedUser(rootUser)}
                                        isActive={selectedUser?.id === rootUser.id}
                                    />
                                )}

                                {/* Dynamic Connection Lines */}
                                {children.length > 0 && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-full max-w-[500px] h-32 pointer-events-none">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120">
                                            {children
                                                .filter((c: any) => c.data?.level === 1)
                                                .slice(0, 3)
                                                .map((_: any, i: number, arr: any[]) => {
                                                    const total = arr.length;
                                                    const x2 = (100 / (total + 1)) * (i + 1);
                                                    return (
                                                        <motion.path
                                                            key={i}
                                                            initial={{ pathLength: 0, opacity: 0 }}
                                                            animate={{ pathLength: 1, opacity: 0.15 }}
                                                            d={`M 250 0 C 250 60, ${80 + (i * 170)} 60, ${80 + (i * 170)} 120`}
                                                            fill="transparent"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeDasharray="4 4"
                                                        />
                                                    );
                                                })}
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Level 1 Nodes */}
                            <div className="flex justify-center w-full gap-24 relative">
                                {children.length > 0 ? children
                                    .filter((child: any) => child.data?.level === 1)
                                    .slice(0, 3)
                                    .map((child: any, i: number) => (
                                        <div key={`container-${child.id}`} className="flex flex-col items-center">
                                            <NodeCard
                                                key={`child-${child.id}-${i}`}
                                                user={child}
                                                onClick={() => setSelectedUser(child)}
                                                isActive={selectedUser?.id === child.id}
                                            />
                                        </div>
                                    )) : (
                                    <div className="w-full p-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[40px]">
                                        No active downline hubs detected in your level 1 circle
                                    </div>
                                )}
                            </div>
                        </div>
                    </AnimatePresence>
                </div>

                {/* 2. Side Panel (Node Details) */}
                <div className="lg:col-span-4 space-y-8">
                    <AnimatePresence mode="wait">
                        {selectedUser ? (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-gray-100 dark:border-white/5 shadow-xl space-y-8 h-full"
                            >
                                <div className="space-y-6">
                                    <div className="w-24 h-24 rounded-3xl bg-[#6C63FF]/10 flex items-center justify-center text-[#6C63FF] border-2 border-[#6C63FF]/20 mx-auto group">
                                        {selectedUser.data?.isRoot ? <Crown size={40} /> : <UserIcon size={40} />}
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-2xl font-black">{selectedUser.data?.label || "Network Member"}</h3>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">ID: #{selectedUser.id.slice(-6)}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-white/5">
                                    <DetailRow label="Direct Team" value={`${selectedUser.data?.referralCount || 0} Members`} />
                                    <DetailRow label="Net Balance" value={`$${selectedUser.data?.balance || "0.00"}`} color="text-[#6C63FF]" />
                                    <DetailRow label="Hub Status" value={selectedUser.data?.planName || "Awaiting Activation"} />
                                </div>

                                <div className="p-6 bg-[#f0e6ff]/50 dark:bg-[#2a1e3a]/20 rounded-3xl space-y-3">
                                    <p className="text-[10px] font-black text-[#6C63FF] uppercase tracking-widest leading-none">Node Summary</p>
                                    <p className="text-xs text-[#5b52e0] dark:text-[#8b9aff] font-bold leading-relaxed">
                                        This hub joined on {selectedUser.data?.joinedAt ? new Date(selectedUser.data.joinedAt).toLocaleDateString() : "untracked date"} and is currently operation at Level {selectedUser.data?.level || 0} in your network.
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleInvite(selectedUser.data.referralCode)}
                                    className="w-full py-4 bg-[#6C63FF] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#6C63FF]/20 hover:bg-[#5B52E5] transition-all active:scale-95"
                                >
                                    {copyStatus === selectedUser.data.referralCode ? "Invitation Copied! ✅" : "Invite Under Node"}
                                    <Send size={14} />
                                </button>
                            </motion.div>
                        ) : (
                            <div className="p-12 text-center bg-slate-50/50 dark:bg-slate-800/10 rounded-[48px] border-2 border-dashed border-slate-100 dark:border-white/5 h-full flex flex-col items-center justify-center space-y-6 opacity-60">
                                <Users size={48} className="text-slate-300" />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Select a hub to view <br /> deeper metrics</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}

function NodeCard({ user, isRoot, onClick, isActive }: any) {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            className={`cursor-pointer p-6 bg-white dark:bg-slate-800 rounded-[32px] border-2 transition-all group flex flex-col items-center gap-4 min-w-[140px] shadow-sm
                ${isActive ? 'border-[#6C63FF] shadow-2xl shadow-[#6C63FF]/10' : 'border-gray-50 dark:border-white/5 hover:border-slate-200'}
            `}
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors
                ${isRoot ? 'bg-[#6C63FF]/10 border-[#6C63FF]/10 text-[#6C63FF]' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 text-slate-400 group-hover:text-[#6C63FF] group-hover:bg-[#6C63FF]/5 group-hover:border-[#6C63FF]/20'}
            `}>
                {isRoot ? <Crown size={24} /> : <UserIcon size={24} />}
            </div>
            <div className="text-center">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[100px] leading-tight mb-1">{user.data?.label || "Member"}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Node L{user.data?.level || 1}</p>
            </div>
        </motion.div>
    );
}

function DetailRow({ label, value, color }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <span className={`text-sm font-black ${color || 'text-slate-900 dark:text-white'}`}>{value}</span>
        </div>
    );
}
