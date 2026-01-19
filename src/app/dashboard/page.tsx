"use client";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Users, Package, Code, Activity, Loader2 } from "lucide-react";

async function fetchUser(uid: string, idToken: string) {
    const res = await fetch("/api/user/me", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid }),
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
}

export default function DashboardPage() {
    const { user: authUser } = useAuth();
    const { data, isLoading, error } = useQuery({
        queryKey: ["user", authUser?.uid],
        queryFn: async () => {
            const token = await authUser!.getIdToken();
            return fetchUser(authUser!.uid, token);
        },
        enabled: !!authUser?.uid,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="w-7 h-7 animate-spin text-[#a8b5ff] dark:text-[#6b7fd7] mx-auto mb-3" />
                    <p className="text-sm text-[#718096] dark:text-[#94a3b8]">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 md:p-6 bg-[#ffcccb] dark:bg-[#3a1e1e] border border-[#ff9999] dark:border-[#4a2a2a] rounded-xl text-[#c53030] dark:text-[#ff6b6b] text-sm">
                Error loading dashboard data.
            </div>
        );
    }

    const userData = data?.user;

    return (
        <div className="space-y-5 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold mb-1.5 text-[#2d3748] dark:text-[#e2e8f0] tracking-tight">
                    Overview
                </h1>
                <p className="text-sm md:text-base text-[#718096] dark:text-[#94a3b8]">Welcome back! Here's your dashboard summary.</p>
            </div>

            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card
                    title="Wallet Balance"
                    value={`₹${userData?.walletBalance || 0}`}
                    icon={<Wallet className="w-4 h-4" />}
                    color="green"
                />
                <Card
                    title="Total Team"
                    value={userData?.referrals?.length || 0}
                    icon={<Users className="w-4 h-4" />}
                    color="blue"
                />
                <Card
                    title="Current Plan"
                    value={userData?.plan?.name || "No Plan"}
                    icon={<Package className="w-4 h-4" />}
                    color="purple"
                />
                <Card
                    title="Referral Code"
                    value={userData?.referralCode || "N/A"}
                    icon={<Code className="w-4 h-4" />}
                    color="pink"
                />
            </div>

            <div className="mt-6 md:mt-8">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <Activity className="w-4 h-4 text-[#718096] dark:text-[#94a3b8]" />
                    <h2 className="text-lg md:text-xl font-semibold text-[#2d3748] dark:text-[#e2e8f0]">Recent Activity</h2>
                </div>
                <div className="bg-white dark:bg-[#252932] rounded-xl border border-[#e8ecf0] dark:border-[#2d3441] p-8 md:p-12 text-center">
                    <div className="inline-flex p-3 bg-[#f5f7fa] dark:bg-[#1e2128] rounded-full mb-3">
                        <Activity className="w-5 h-5 text-[#a0aec0] dark:text-[#64748b]" />
                    </div>
                    <p className="text-[#718096] dark:text-[#94a3b8] font-medium text-sm md:text-base">No recent activity</p>
                    <p className="text-xs md:text-sm text-[#a0aec0] dark:text-[#64748b] mt-1.5">Your activity will appear here</p>
                </div>
            </div>
        </div>
    );
}

function Card({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
    const colorClasses = {
        blue: "bg-[#e6f0ff] dark:bg-[#1e2a3a] text-[#4a7cff] dark:text-[#6b9aff] border-[#c5d0ff] dark:border-[#3a4a6a]",
        green: "bg-[#e6ffe6] dark:bg-[#1e3a2a] text-[#4aaf7c] dark:text-[#6bc99a] border-[#b8e6d3] dark:border-[#2a4a3a]",
        purple: "bg-[#f0e6ff] dark:bg-[#2a1e3a] text-[#8b4aff] dark:text-[#a86bff] border-[#d6c5ff] dark:border-[#4a3a6a]",
        pink: "bg-[#ffe6f0] dark:bg-[#3a1e2a] text-[#ff6ba8] dark:text-[#ff8bc5] border-[#ffccd6] dark:border-[#4a2a3a]",
    };

    return (
        <div className="bg-white dark:bg-[#252932] p-4 md:p-5 rounded-xl border border-[#e8ecf0] dark:border-[#2d3441] hover:border-opacity-60 transition-all">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-[#718096] dark:text-[#94a3b8] uppercase tracking-wide">{title}</h3>
                <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} border`}>
                    {icon}
                </div>
            </div>
            <p className="text-xl md:text-2xl font-semibold text-[#2d3748] dark:text-[#e2e8f0]">{value}</p>
        </div>
    );
}
