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
    const { user: authUser } = useAuth();
    const [selectedUser, setSelectedUser] = useState<any>(null);

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
                    <button className="px-6 py-3 bg-[#6C63FF] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#6C63FF]/20 flex items-center gap-2">
                        <Send size={14} /> Send Invitation
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
                        <div className="relative z-10 space-y-24 w-full flex flex-col items-center min-w-[600px] py-10">
                            {/* Root Node */}
                            {rootUser && (
                                <NodeCard
                                    user={rootUser}
                                    isRoot
                                    onClick={() => setSelectedUser(rootUser)}
                                    isActive={selectedUser?.id === rootUser.id}
                                />
                            )}

                            {/* Connection Lines (SVGs) */}
                            <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full h-24 pointer-events-none opacity-10">
                                <svg className="w-full h-full">
                                    <line x1="50%" y1="0" x2="25%" y2="100%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                    <line x1="50%" y1="0" x2="75%" y2="100%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                </svg>
                            </div>

                            {/* Level 1 Nodes */}
                            <div className="flex justify-between w-full max-w-4xl gap-8">
                                {children.length > 0 ? children.slice(0, 3).map((child: any, i: number) => (
                                    <NodeCard
                                        key={child.id || i}
                                        user={child}
                                        onClick={() => setSelectedUser(child)}
                                        isActive={selectedUser?.id === child.id}
                                    />
                                )) : (
                                    <div className="w-full p-10 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">No downline hubs detected</div>
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
                                    <DetailRow label="Total Team" value="142 Member" />
                                    <DetailRow label="Total Net" value="$12,450.00" color="text-[#6C63FF]" />
                                    <DetailRow label="Reduction" value="12%" />
                                </div>

                                <div className="p-6 bg-[#f0e6ff]/50 dark:bg-[#2a1e3a]/20 rounded-3xl space-y-3">
                                    <p className="text-[10px] font-black text-[#6C63FF] uppercase tracking-widest leading-none">Node Summary</p>
                                    <p className="text-xs text-[#5b52e0] dark:text-[#8b9aff] font-bold leading-relaxed">
                                        This hub has reached Level {selectedUser.data?.level || 1} efficiency and is contributing $420/mo to your upline rewards.
                                    </p>
                                </div>

                                <button className="w-full py-4 bg-[#6C63FF] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#6C63FF]/20">
                                    Send Invitation <Send size={14} />
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
