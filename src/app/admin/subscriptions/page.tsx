"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users,
    Zap,
    PlusCircle,
    Monitor,
    Key,
    ExternalLink,
    CheckCircle2,
    Clock,
    ChevronRight,
    Search,
    ShieldCheck,
    Loader2,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function AdminSubscriptionsPage() {
    const { user: authUser, userData, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Fetch Pending Subscriptions
    const { data, isLoading } = useQuery({
        queryKey: ["admin", "pending-subscriptions"],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/admin/subscriptions", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Unauthorized");
            return res.json();
        },
        enabled: !!authUser && userData?.role === 'ADMIN'
    });

    // Assign Mutation
    const assignMutation = useMutation({
        mutationFn: async (payload: any) => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/admin/subscriptions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "pending-subscriptions"] });
            setSelectedUser(null);
        }
    });

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

    const filteredUsers = data?.users?.filter((u: any) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <Loader2 className="w-10 h-10 animate-spin text-[#6C63FF]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] p-8 md:p-16">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#6C63FF] rounded-lg flex items-center justify-center text-white">
                                <ShieldCheck size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-[#6C63FF]">Admin Command Center</span>
                        </div>
                        <h1 className="text-4xl font-black font-outfit tracking-tight text-slate-900 dark:text-white uppercase">OTT Fulfillment</h1>
                        <p className="text-slate-500 font-medium">Manage and assign credentials to premium growth partners.</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find partner..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl w-full md:w-80 shadow-sm focus:ring-2 focus:ring-[#6C63FF]/20 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredUsers?.map((user: any) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 p-10 space-y-8 shadow-xl hover:shadow-2xl transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black font-outfit uppercase tracking-tighter text-slate-900 dark:text-white">{user.name}</h3>
                                    <p className="text-xs font-bold text-slate-400 truncate max-w-[150px]">{user.email}</p>
                                </div>
                                <div className="px-3 py-1 bg-[#6C63FF]/10 text-[#6C63FF] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#6C63FF]/20">
                                    Growth Plan
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Clock size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-amber-500">
                                    <Zap size={16} fill="currentColor" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Pending Activation</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedUser(user)}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg group-hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                Assign Credentials <ChevronRight size={14} />
                            </button>
                        </motion.div>
                    ))}
                </div>

                {filteredUsers?.length === 0 && (
                    <div className="text-center py-20 space-y-4">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <Monitor size={40} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">All partners are synchronized.</p>
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setSelectedUser(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden p-12 space-y-10"
                        >
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black font-outfit uppercase tracking-tighter">Assign Portal</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">User: {selectedUser.name}</p>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <form className="space-y-6" onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                assignMutation.mutate({
                                    userId: selectedUser.id,
                                    platform: formData.get("platform"),
                                    username: formData.get("username"),
                                    password: formData.get("password"),
                                    link: formData.get("link"),
                                });
                            }}>
                                <div className="space-y-4">
                                    <InputItem name="platform" label="Service Name" placeholder="e.g. Netflix Premium" icon={<Monitor size={18} />} required />
                                    <InputItem name="username" label="Email / Username" placeholder="partner@ott.com" icon={<Users size={18} />} />
                                    <InputItem name="password" label="Portal Key" placeholder="••••••••" icon={<Key size={18} />} />
                                    <InputItem name="link" label="Direct Access Link" placeholder="https://..." icon={<ExternalLink size={18} />} />
                                </div>

                                <button
                                    type="submit"
                                    disabled={assignMutation.isPending}
                                    className="w-full py-5 bg-[#6C63FF] hover:bg-[#5B52E5] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#6C63FF]/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {assignMutation.isPending ? <Loader2 className="animate-spin" /> : <>Finalize Distribution <CheckCircle2 size={16} /></>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InputItem({ label, icon, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>
            <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#6C63FF] transition-colors">
                    {icon}
                </div>
                <input
                    {...props}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-[#6C63FF]/10 transition-all placeholder:text-slate-200"
                />
            </div>
        </div>
    );
}
