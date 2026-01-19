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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return <div className="p-6 text-red-500">Error loading earnings data.</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Earnings Dashboard</h1>
                <p className="text-sm text-gray-500">Real-time stats for {user?.email}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Earnings"
                    value={`$${data?.totalEarnings || "0.00"}`}
                    icon={<TrendingUp className="text-green-500" />}
                    description="Lifetime income distributed to wallet"
                />
                <StatCard
                    title="Direct Income"
                    value={`$${data?.directIncome || "0.00"}`}
                    icon={<ArrowUpRight className="text-blue-500" />}
                    description="Commissions from direct referrals"
                />
                <StatCard
                    title="Team Income"
                    value={`$${data?.teamIncome || "0.00"}`}
                    icon={<Users className="text-purple-500" />}
                    description="Earnings from multi-level network"
                />
            </div>

            {/* Transaction History */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Recent Transactions</h2>
                    <button className="text-sm text-blue-600 hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-zinc-900/50 text-xs uppercase text-gray-500 font-medium">
                                <th className="px-6 py-4">Transaction</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                            {data?.recentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No transactions found yet.
                                    </td>
                                </tr>
                            ) : (
                                data?.recentTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${tx.type === "CREDIT" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                                    {tx.type === "CREDIT" ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{tx.description}</p>
                                                    <p className="text-xs text-gray-500">ID: #{tx.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 uppercase">
                                                Completed
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-semibold ${tx.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
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

function StatCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
                <div className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold mb-2">{value}</div>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    );
}
