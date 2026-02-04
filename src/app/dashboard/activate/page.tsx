"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Zap, Activity, Globe, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Web3Payment from "@/components/Web3Payment";
import WalletDepositModal from "@/components/WalletDepositModal";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function ActivatePage() {
    const { user: authUser } = useAuth();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const { data: userDataResponse } = useQuery({
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
        enabled: !!authUser?.uid,
    });

    const pendingOtt = ottData?.subscriptions?.find((s: any) => s.status === "PENDING" || s.status === "PENDING_APPROVAL");

    // If already has plan OR pending approval, redirect
    React.useEffect(() => {
        if (userData?.plan) {
            router.push("/dashboard");
        } else if (pendingOtt) {
            router.push("/dashboard/pending");
        }
    }, [userData, pendingOtt, router]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] p-4 md:p-10 flex flex-col items-center justify-center space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-[#6C63FF]/10 rounded-full border border-[#6C63FF]/20 text-[#6C63FF] text-[10px] font-black uppercase tracking-widest"
                >
                    Activation Required
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-outfit">
                    Unlock Your Financial Growth
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Complete your one-time activation to access premium benefits and start earning rewards today. Join thousands of users in our global ecosystem.
                </p>
            </div>

            {/* Plan Card */}
            <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2">
                {/* Left Side - Price & Name */}
                <div className="bg-[#6C63FF] p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black font-outfit">$6 Plan</h3>
                            <p className="text-white/70 text-sm font-medium leading-tight">
                                The ultimate gateway to passive income and rewards.
                            </p>
                        </div>
                        <div className="pt-8">
                            <span className="text-6xl font-black font-outfit tracking-tighter">$6</span>
                            <span className="text-white/60 text-sm font-bold uppercase tracking-widest ml-2">per month</span>
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck size={14} />
                            Verified System Provider
                        </div>
                    </div>
                </div>

                {/* Right Side - Benefits & Action */}
                <div className="p-12 space-y-10 flex flex-col justify-between bg-white dark:bg-slate-900">
                    <div className="space-y-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Benefits</p>

                        <div className="space-y-6">
                            <BenefitItem
                                icon={<Globe size={20} className="text-[#6C63FF]" />}
                                title="OTT Access"
                                desc="Stream premium content across multiple platforms included in your subscription."
                            />
                            <BenefitItem
                                icon={<Zap size={20} className="text-[#6C63FF]" />}
                                title="Target Incentives"
                                desc="Unlock high-commission milestones based on your referral performance."
                            />
                            <BenefitItem
                                icon={<Activity size={20} className="text-[#6C63FF]" />}
                                title="Auto Pool Entry"
                                desc="Global passive income stream where members are added automatically."
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full py-5 bg-[#6C63FF] hover:bg-[#5B52E5] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#6C63FF]/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            Pay Now <ArrowRight size={16} />
                        </button>

                        <div className="flex justify-center gap-6 grayscale opacity-40">
                            <ShieldCheck size={18} />
                            <Activity size={18} />
                            <Globe size={18} />
                        </div>
                    </div>

                    <WalletDepositModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={() => {
                            setIsModalOpen(false);
                            router.push("/dashboard/pending");
                        }}
                        initialAmount="600"
                    />
                </div>
            </div>

            <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>© 2024 Referral Platform. All rights reserved.</span>
                <div className="flex gap-4">
                    <Link href="#" className="hover:text-[#6C63FF]">Support</Link>
                    <Link href="#" className="hover:text-[#6C63FF]">Terms of Service</Link>
                </div>
            </div>
        </div>
    );
}

function BenefitItem({ icon, title, desc }: any) {
    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white font-outfit uppercase tracking-wider">{title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
