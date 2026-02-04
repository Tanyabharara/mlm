
"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    Clock,
    ShieldCheck,
    Zap,
    ArrowRight,
    LayoutDashboard,
    CheckCircle2,
    Loader2,
    Monitor
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
    const { user: authUser, userData } = useAuth();
    const router = useRouter();

    // OTT Data Query to check for approval
    const { data: ottData, isLoading } = useQuery({
        queryKey: ["user", "ott", authUser?.uid],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            const res = await fetch("/api/user/ott", {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        enabled: !!authUser?.uid,
        refetchInterval: 10000, // Poll every 10s to see if approved
    });

    const subscriptions = ottData?.subscriptions || [];
    const activeOtt = subscriptions.find((s: any) => s.status === "ACTIVE");
    const isPending = subscriptions.find((s: any) => s.status === "PENDING" || s.status === "PENDING_APPROVAL");

    // Re-check user plan status too
    const { data: meData } = useQuery({
        queryKey: ["user", "me-status", authUser?.uid],
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
        refetchInterval: 10000,
    });

    const isPlanActive = meData?.user?.plan || userData?.plan;

    // If approved, take them to dashboard
    React.useEffect(() => {
        if (activeOtt || isPlanActive) {
            router.push("/dashboard");
        }
    }, [activeOtt, isPlanActive, router]);

    // If they have no pending request and no plan, they shouldn't be here
    React.useEffect(() => {
        if (!isLoading && !isPending && !activeOtt && !isPlanActive && meData) {
            router.push("/dashboard/activate");
        }
    }, [isLoading, isPending, activeOtt, isPlanActive, router, meData]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#020617]">
                <Loader2 className="w-10 h-10 animate-spin text-[#6C63FF]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-xl w-full space-y-12">
                {/* Visual Icon */}
                <div className="relative">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-32 h-32 bg-[#6C63FF]/10 rounded-[40px] flex items-center justify-center mx-auto relative z-10"
                    >
                        <Clock size={48} className="text-[#6C63FF] animate-pulse" />
                    </motion.div>
                    <div className="absolute inset-0 bg-[#6C63FF]/5 blur-[100px] rounded-full scale-150" />
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white font-outfit uppercase">
                        Payment Verified
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                        <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                            Awaiting Admin Approval
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4">
                        Great! Your payment has been successfully recorded in our system. An administrator is now verifying the transaction and setting up your credentials.
                    </p>
                </div>

                {/* Steps Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <StepItem
                        icon={<ShieldCheck size={20} className="text-emerald-500" />}
                        title="Transaction Logged"
                        desc="Your $6.00 payment is visible on the blockchain ledger."
                        completed={true}
                    />
                    <StepItem
                        icon={<Monitor size={20} className="text-[#6C63FF]" />}
                        title="License Distribution"
                        desc="Admin will manually assign your OTT access keys shortly."
                        completed={false}
                    />
                </div>

                {/* Actions */}
                <div className="pt-8 space-y-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#6C63FF] transition-all"
                    >
                        Return to Dashboard <LayoutDashboard size={14} />
                    </Link>
                    <div className="flex justify-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
                        <span>ESTIMATED TIME: 5-30 MINS</span>
                        <span>•</span>
                        <span>24/7 MONITORING ACTIVE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepItem({ icon, title, desc, completed }: any) {
    return (
        <div className={`p-6 bg-white dark:bg-slate-900 rounded-3xl border ${completed ? 'border-emerald-500/20' : 'border-slate-100 dark:border-white/5'} shadow-sm space-y-3`}>
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                    {icon}
                </div>
                {completed && <CheckCircle2 size={16} className="text-emerald-500" />}
            </div>
            <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-normal">{desc}</p>
            </div>
        </div>
    );
}
