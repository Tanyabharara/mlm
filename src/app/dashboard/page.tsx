"use client";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

async function fetchUser(uid: string) {
    const res = await fetch("/api/user/me", {
        method: "POST",
        body: JSON.stringify({ uid }),
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
}

export default function DashboardPage() {
    const { user: authUser } = useAuth();
    const { data, isLoading, error } = useQuery({
        queryKey: ["user", authUser?.uid],
        queryFn: () => fetchUser(authUser!.uid),
        enabled: !!authUser?.uid,
    });

    if (isLoading) return <div className="p-6">Loading dashboard data...</div>;

    const userData = data?.user;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Overview</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card title="Wallet Balance" value={`₹${userData?.walletBalance || 0}`} />
                <Card title="Total Team" value={userData?.referrals?.length || 0} />
                <Card title="Current Plan" value={userData?.plan?.name || "No Plan"} />
                <Card title="Referral Code" value={userData?.referralCode || "N/A"} />
            </div>

            <div className="mt-8">
                 <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Recent Activity</h2>
                 <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-8 text-center text-gray-500">
                     No recent activity.
                 </div>
            </div>
        </div>
    );
}

function Card({ title, value }: { title: string; value: string | number }) {
    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
        </div>
    )
}
