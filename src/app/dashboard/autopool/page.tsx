"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    Users,
    TrendingUp,
    Lock,
    CheckCircle2,
    Clock,
    Network,
    ArrowRight,
    Search
} from "lucide-react";

export default function AutoPoolPage() {
    const { user } = useAuth() as any;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activePoolId, setActivePoolId] = useState(1);

    const fetchData = async () => {
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/user/autopool", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            setData(json);

            // Set active pool to current progress
            const current = json.pools.find((p: any) => p.status === 'ACTIVE');
            if (current) setActivePoolId(current.id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    if (loading) return (
        <div className="flex h-full items-center justify-center p-20">
            <div className="w-10 h-10 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const activePool = data?.pools.find((p: any) => p.id === activePoolId);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
            {/* 1. Header & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Auto Pool Status Dashboard</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Time-based global referral system · Sequential filling</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-[#4CAF50]/20">
                        <CheckCircle2 size={12} /> Active in {activePool?.name}
                    </div>
                </div>
            </div>

            {/* 2. Pool Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data?.pools.map((pool: any) => (
                    <motion.button
                        key={pool.id}
                        whileHover={{ y: -2 }}
                        onClick={() => pool.status !== 'LOCKED' && setActivePoolId(pool.id)}
                        className={`p-6 rounded-[32px] border transition-all text-left relative overflow-hidden group ${activePoolId === pool.id
                            ? 'bg-white dark:bg-slate-900 border-[#6C63FF] shadow-xl'
                            : 'bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200'
                            } ${pool.status === 'LOCKED' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${activePoolId === pool.id ? 'text-[#6C63FF]' : 'text-slate-400'}`}>
                                    {pool.name}
                                </p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">₹{pool.entryFee}</h3>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pool.status === 'COMPLETED' ? 'bg-[#4CAF50]/10 text-[#4CAF50]' :
                                pool.status === 'ACTIVE' ? 'bg-[#6C63FF]/10 text-[#6C63FF]' :
                                    'bg-slate-200 text-slate-400'
                                }`}>
                                {pool.status === 'COMPLETED' ? <CheckCircle2 size={16} /> :
                                    pool.status === 'ACTIVE' ? <TrendingUp size={16} /> :
                                        <Lock size={16} />}
                            </div>
                        </div>
                        {pool.status === 'ACTIVE' && (
                            <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#6C63FF]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(pool.stats.l1 / 3) * 100}%` }}
                                />
                            </div>
                        )}
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                            {pool.status === 'COMPLETED' ? 'Upgrade successfully' :
                                pool.status === 'LOCKED' ? 'Entry Locked' :
                                    `Current Level ${pool.stats.l1 >= 3 ? (pool.stats.l2 >= 9 ? '3' : '2') : '1'} of 3`}
                        </p>
                    </motion.button>
                ))}
            </div>

            {/* 3. Main Analytics Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Tree Card */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 border border-gray-100 dark:border-white/5 shadow-xl space-y-12">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Member Node Structure</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Matrix Hierarchy · {activePool?.name}</p>
                        </div>
                        <div className="px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} /> Live Status
                        </div>
                    </div>

                    {/* Matrix Tree Visualization */}
                    <div className="py-10 flex flex-col items-center gap-12">
                        {/* Root: YOU */}
                        <div className="relative">
                            <div className="w-14 h-14 bg-[#6C63FF] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#6C63FF]/30 relative z-10 border-4 border-white dark:border-slate-900">
                                <Users size={24} />
                            </div>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-[#6C63FF] uppercase tracking-widest">YOU</div>

                            {/* Connection Lines (Down to L1) */}
                            <svg className="absolute top-14 left-1/2 -translate-x-1/2 w-64 h-12 overflow-visible pointer-events-none opacity-20">
                                <path d="M 32 0 L 0 45" stroke="#6C63FF" strokeWidth="2" fill="none" />
                                <path d="M 32 0 L 32 45" stroke="#6C63FF" strokeWidth="2" fill="none" />
                                <path d="M 32 0 L 64 45" stroke="#6C63FF" strokeWidth="2" fill="none" />
                            </svg>
                        </div>

                        {/* Level 1 Nodes */}
                        <div className="flex justify-between w-full max-w-lg">
                            {[0, 1, 2].map((idx) => {
                                const isFilled = activePool?.stats.l1 > idx;
                                return (
                                    <div key={idx} className="relative">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isFilled ? 'bg-[#4CAF50] text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-300'
                                            } relative z-10 border-4 border-white dark:border-slate-900`}>
                                            <Users size={16} />
                                        </div>
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-400 uppercase tracking-widest">L1-N{idx + 1}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Progress Details */}
                        <div className="w-full bg-slate-50 dark:bg-white/5 rounded-[32px] p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={`w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 ${i < activePool?.stats.l1 ? 'bg-[#4CAF50]' : 'bg-slate-200'}`} />
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                        L{activePool?.stats.l1 >= 3 ? '2' : '1'}: {activePool?.stats.l1}/3 Members Filled
                                    </p>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#6C63FF]">
                                    {Math.round((activePool?.stats.l1 / 3) * 100)}% Yield per node
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Tree Visualization is already above, this was the footer of that card */}
                </div>

                {/* Sidebar Stats */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Income Breakdown Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-gray-100 dark:border-white/5 shadow-xl space-y-8">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Income Breakdown</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-slate-400">Level-wise Earnings Model</p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { level: 1, users: 3, percentage: 10, reward: (Number(activePool?.entryFee) * 0.10).toFixed(0) },
                                { level: 2, users: 9, percentage: 20, reward: (Number(activePool?.entryFee) * 0.20).toFixed(0) },
                                { level: 3, users: 27, percentage: 30, reward: (Number(activePool?.entryFee) * 0.30).toFixed(0) },
                            ].map((row, i) => (
                                <div key={i} className="flex justify-between items-center group">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Level {row.level} ({row.users} Nodes)</p>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${i === 0 ? 'text-[#6C63FF]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                            {row.percentage}% Commission
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{row.users} x ₹{row.reward}</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">₹{Number(row.reward) * row.users}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-[#6C63FF]/5 rounded-3xl border border-transparent dark:border-[#6C63FF]/20 flex justify-between items-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#6C63FF]">
                                ₹{(Number(activePool?.entryFee) * 10.2).toFixed(0)}
                            </p>
                        </div>
                        {activePool?.id === 2 && (
                            <p className="text-[8px] text-center text-[#ff6b6b] font-black uppercase tracking-widest -mt-4">
                                Includes ₹20 Company Maintenance Stake
                            </p>
                        )}
                        <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest">Based on unique FIFO priority calculator</p>
                    </div>

                    {/* Recent Placements Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-gray-100 dark:border-white/5 shadow-xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white uppercase">Recent Placements</h3>
                            <button className="text-[10px] font-black text-[#6C63FF] uppercase tracking-widest">View All</button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { title: 'New member added (L1-N1)', desc: '2 hours ago', val: '+₹30', color: 'green' },
                                { title: 'Auto-upgrade to Pool 1', desc: 'Yesterday', val: '0', color: 'blue' },
                                { title: 'Level 1 Complete', desc: '4 days ago', val: '+₹90', color: 'green' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${item.color === 'green' ? 'bg-[#4CAF50]' : 'bg-[#6C63FF]'}`} />
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white leading-none mb-1 uppercase tracking-tight">{item.title}</p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase">{item.desc}</p>
                                        </div>
                                    </div>
                                    <p className={`text-xs font-black ${item.color === 'green' ? 'text-[#4CAF50]' : 'text-[#6C63FF]'}`}>{item.val}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-slate-50 transition-colors">
                            View Full History
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Core Principle Footer */}
            <div className="text-center py-8 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Principle</p>
                <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase">
                    User Enters <ArrowRight size={12} /> System Places <ArrowRight size={12} /> Pool Fills <ArrowRight size={12} /> Income Distributes <ArrowRight size={12} /> Auto Upgrade
                </div>
            </div>
        </div>
    );
}
