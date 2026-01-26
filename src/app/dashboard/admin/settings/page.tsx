"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings,
    Percent,
    Users,
    Save,
    ShieldAlert,
    Wallet,
    DollarSign,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminSettings() {
    const { user: authUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [config, setConfig] = useState({
        treasuryAddress: '',
        planPrice: '600',
        L1: 10,
        L2: 5,
        L3: 1,
        L4_10: 0.5,
        poolEntry: 100,
        poolReward: 500
    });

    useEffect(() => {
        fetchConfig();
    }, [authUser]);

    const fetchConfig = async () => {
        if (!authUser) return;
        try {
            const token = await authUser.getIdToken();
            const res = await fetch('/api/admin/config', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.config && Object.keys(data.config).length > 0) {
                setConfig({ ...config, ...data.config });
            }
        } catch (error) {
            console.error("Failed to fetch config");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const token = await authUser!.getIdToken();
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });

            if (!res.ok) throw new Error("Failed to save");

            setMessage({ type: 'success', text: 'Configuration saved successfully! ✨' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#6C63FF] animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Admin Control</h1>
                    <p className="text-gray-500 font-medium">Configure global treasury and economy logic 👑</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-[#f0e6ff] rounded-2xl border border-[#6C63FF]/20">
                    <ShieldAlert className="w-5 h-5 text-[#6C63FF]" />
                    <span className="text-xs font-black text-[#6C63FF] uppercase tracking-widest">Admin Access Verified</span>
                </div>
            </div>

            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 font-bold
                            ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}
                        `}
                    >
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Treasury Settings */}
                <div className="bg-white dark:bg-[#1e1e2d] p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8 lg:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#6C63FF]/10 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-[#6C63FF]" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Treasury Management</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Destination Wallet Address (USDT BSC)</label>
                            <input
                                placeholder="0x..."
                                value={config.treasuryAddress}
                                onChange={(e) => setConfig({ ...config, treasuryAddress: e.target.value })}
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#6C63FF]/30 rounded-2xl outline-none font-mono text-sm font-bold"
                            />
                            <p className="text-[10px] text-gray-400 italic mt-1 ml-1 px-1">
                                * All payments of {config.planPrice} USDT will be sent directly to this address.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Plan Pricing */}
                <div className="bg-white dark:bg-[#1e1e2d] p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#4CAF50]/10 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-[#4CAF50]" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Plan 1 Economy</h3>
                    </div>

                    <div className="space-y-6">
                        <ConfigInput
                            label="Total Plan Price (USDT)"
                            value={config.planPrice}
                            onChange={(v) => setConfig({ ...config, planPrice: v })}
                        />
                        <ConfigInput
                            label="Auto Pool Entry portion ($)"
                            value={config.poolEntry}
                            onChange={(v) => setConfig({ ...config, poolEntry: v })}
                        />
                        <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-3xl space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase opacity-40">
                                <span>Ref. Distribution Capacity</span>
                                <span>{parseFloat(config.planPrice) - parseFloat(config.poolEntry.toString())} USDT</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Referral Logic */}
                <div className="bg-white dark:bg-[#1e1e2d] p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#6C63FF]/10 flex items-center justify-center">
                            <Percent className="w-6 h-6 text-[#6C63FF]" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Referral Rewards</h3>
                    </div>

                    <div className="space-y-4">
                        <ConfigInput label="Level 1 (%)" value={config.L1} onChange={(v) => setConfig({ ...config, L1: v })} />
                        <ConfigInput label="Level 2 (%)" value={config.L2} onChange={(v) => setConfig({ ...config, L2: v })} />
                        <ConfigInput label="Level 3 (%)" value={config.L3} onChange={(v) => setConfig({ ...config, L3: v })} />
                        <ConfigInput label="Level 4-10 (%)" value={config.L4_10} onChange={(v) => setConfig({ ...config, L4_10: v })} />
                    </div>
                </div>

            </div>

            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full md:w-fit px-16 py-5 bg-[#6C63FF] hover:bg-[#5b52e0] text-white rounded-[24px] font-black uppercase tracking-widest shadow-2xl shadow-[#6C63FF]/30 flex items-center justify-center gap-3 mx-auto transition-all active:scale-95 disabled:opacity-70"
            >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                Save Platform Configuration
            </button>
        </div>
    );
}

function ConfigInput({ label, value, onChange }: { label: string; value: string | number; onChange: (v: any) => void }) {
    return (
        <div className="flex items-center justify-between gap-4 p-2">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{label}</span>
            <input
                type={typeof value === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-32 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#6C63FF]/30 rounded-2xl outline-none text-right font-black text-[#6C63FF]"
            />
        </div>
    );
}
