"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Wallet, TrendingUp, LogOut } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-zinc-900 text-black dark:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">MLM Platform</h1>
        </div>
        <nav className="mt-6 px-4 space-y-2 flex-1">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem href="/dashboard/network" icon={<Users size={20} />} label="My Network" />
          <NavItem href="/dashboard/earnings" icon={<TrendingUp size={20} />} label="Earnings" />
          <NavItem href="/dashboard/wallet" icon={<Wallet size={20} />} label="Wallet" />
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-zinc-700 space-y-4">
          <div className="flex items-center gap-3">
            {user?.photoURL && <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />}
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between px-6 md:hidden">
          <h2 className="font-semibold text-lg">Dashboard</h2>
          <button
            onClick={() => logout()}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <LogOut size={20} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
      {icon}
      <span>{label}</span>
    </Link>
  )
}
