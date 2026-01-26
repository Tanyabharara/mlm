"use client";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Users, Wallet, Loader2 } from "lucide-react";
import { EarningsData } from "@/types/earnings";

export default function EarningsPage() {
    const { user } = useAuth();

    const { data, isLoading, error } = useQuery<EarningsData>({
        queryKey: ["earnings", user?.email],
        queryFn: async () => {
            const response = await fetch("/api/user/earnings", {
                headers: {
                    "x-user-email": user?.email || "",
                    Authorization: `Bearer ${await user!.getIdToken()}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch earnings");
            return response.json();
        },
        enabled: !!user?.uid,
    });

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-7 w-7 animate-spin text-[#a8b5ff] dark:text-[#6b7fd7] mx-auto mb-3" />
                    <p className="text-sm text-[#718096] dark:text-[#94a3b8]">Loading earnings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 md:p-6 bg-[#ffcccb] dark:bg-[#3a1e1e] border border-[#ff9999] dark:border-[#4a2a2a] rounded-xl text-[#c53030] dark:text-[#ff6b6b] text-sm">Error loading earnings data.</div>;
    }

    return (
        <div className="space-y-5 md:space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold mb-1.5 text-[#2d3748] dark:text-[#e2e8f0] tracking-tight">
                    Earnings Dashboard
                </h1>
                <p className="text-sm md:text-base text-[#718096] dark:text-[#94a3b8]">Real-time stats for {user?.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <StatCard
                    title="Total Earnings"
                    value={`$${data?.totalEarnings || "0.00"}`}
                    icon={<TrendingUp className="w-4 h-4" />}
                    description="Lifetime income distributed to wallet"
                    color="green"
                />
                <StatCard
                    title="Direct Income"
                    value={`$${data?.directIncome || "0.00"}`}
                    icon={<ArrowUpRight className="w-4 h-4" />}
                    description="Commissions from direct referrals"
                    color="blue"
                />
                <StatCard
                    title="Team Income"
                    value={`$${data?.teamIncome || "0.00"}`}
                    icon={<Users className="w-4 h-4" />}
                    description="Earnings from multi-level network"
                    color="purple"
                />
            </div>

            <div className="bg-white dark:bg-[#252932] rounded-xl border border-[#e8ecf0] dark:border-[#2d3441] overflow-hidden">
                <div className="p-4 md:p-5 border-b border-[#e8ecf0] dark:border-[#2d3441] flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-semibold text-[#2d3748] dark:text-[#e2e8f0]">Recent Transactions</h2>
                    <button className="text-xs md:text-sm text-[#718096] dark:text-[#94a3b8] hover:text-[#4a5568] dark:hover:text-[#cbd5e0] font-medium transition-colors">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#f5f7fa] dark:bg-[#1e2128] text-xs uppercase text-[#718096] dark:text-[#94a3b8] font-medium">
                                <th className="px-4 md:px-5 py-3">Transaction</th>
                                <th className="px-4 md:px-5 py-3 hidden sm:table-cell">Date</th>
                                <th className="px-4 md:px-5 py-3 hidden md:table-cell">Status</th>
                                <th className="px-4 md:px-5 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8ecf0] dark:divide-[#2d3441]">
                            {data?.recentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-10 text-center text-[#718096] dark:text-[#94a3b8] text-sm">
                                        No transactions found yet.
                                    </td>
                                </tr>
                            ) : (
                                data?.recentTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-[#f5f7fa] dark:hover:bg-[#1e2128] transition-colors">
                                        <td className="px-4 md:px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`p-1.5 rounded-lg border ${tx.type === "CREDIT" ? "bg-[#e6ffe6] dark:bg-[#1e3a2a] text-[#4aaf7c] dark:text-[#6bc99a] border-[#b8e6d3] dark:border-[#2a4a3a]" : "bg-[#ffe6f0] dark:bg-[#3a1e2a] text-[#ff6ba8] dark:text-[#ff8bc5] border-[#ffccd6] dark:border-[#4a2a3a]"}`}>
                                                    {tx.type === "CREDIT" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-[#2d3748] dark:text-[#e2e8f0]">{tx.description}</p>
                                                    <p className="text-xs text-[#a0aec0] dark:text-[#64748b] sm:hidden">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-xs text-[#a0aec0] dark:text-[#64748b] hidden sm:block">ID: #{tx.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-xs md:text-sm text-[#718096] dark:text-[#94a3b8] hidden sm:table-cell">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 hidden md:table-cell">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#e6ffe6] dark:bg-[#1e3a2a] text-[#4aaf7c] dark:text-[#6bc99a] border border-[#b8e6d3] dark:border-[#2a4a3a]">
                                                Completed
                                            </span>
                                        </td>
                                        <td className={`px-4 md:px-5 py-3.5 text-right font-semibold text-sm ${tx.type === "CREDIT" ? "text-[#4aaf7c] dark:text-[#6bc99a]" : "text-[#ff6ba8] dark:text-[#ff8bc5]"}`}>
                                            {tx.type === "CREDIT" ? "+" : "-"}${tx.amount}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, description, color }: { title: string; value: string; icon: React.ReactNode; description: string; color: string }) {
    const colorClasses = {
        blue: "bg-[#e6f0ff] dark:bg-[#1e2a3a] text-[#4a7cff] dark:text-[#6b9aff] border-[#c5d0ff] dark:border-[#3a4a6a]",
        green: "bg-[#e6ffe6] dark:bg-[#1e3a2a] text-[#4aaf7c] dark:text-[#6bc99a] border-[#b8e6d3] dark:border-[#2a4a3a]",
        purple: "bg-[#f0e6ff] dark:bg-[#2a1e3a] text-[#8b4aff] dark:text-[#a86bff] border-[#d6c5ff] dark:border-[#4a3a6a]",
    };

    return (
        <div className="bg-white dark:bg-[#252932] p-4 md:p-5 rounded-xl border border-[#e8ecf0] dark:border-[#2d3441] hover:border-opacity-60 transition-all">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-[#718096] dark:text-[#94a3b8] uppercase tracking-wide">{title}</h3>
                <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} border`}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl md:text-3xl font-semibold mb-2 text-[#2d3748] dark:text-[#e2e8f0]">{value}</div>
            <p className="text-xs text-[#a0aec0] dark:text-[#64748b]">{description}</p>
        </div>
    );
}
