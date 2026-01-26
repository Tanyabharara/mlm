"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Wallet, TrendingUp, LogOut, Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafbfc] dark:bg-[#1a1d24]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#a8b5ff] dark:border-[#6b7fd7] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[#718096] dark:text-[#94a3b8] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#fafbfc] dark:bg-[#1a1d24] text-[#2d3748] dark:text-[#e2e8f0]">
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#252932] border-r border-[#e8ecf0] dark:border-[#2d3441] flex flex-col transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 md:p-6 border-b border-[#e8ecf0] dark:border-[#2d3441]">
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-semibold text-[#2d3748] dark:text-[#e2e8f0] tracking-tight">MLM Platform</h1>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-2 hover:bg-[#f5f7fa] dark:hover:bg-[#2d3441] rounded-lg transition-colors"
            >
              <X size={18} className="text-[#718096] dark:text-[#94a3b8]" />
            </button>
          </div>
        </div>
        <nav className="mt-4 px-3 md:px-4 space-y-1 flex-1 overflow-y-auto">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" active={pathname === "/dashboard"} />
          <NavItem href="/dashboard/network" icon={<Users size={18} />} label="My Network" active={pathname === "/dashboard/network"} />
          <NavItem href="/dashboard/earnings" icon={<TrendingUp size={18} />} label="Earnings" active={pathname === "/dashboard/earnings"} />
          <NavItem href="/dashboard/wallet" icon={<Wallet size={18} />} label="Wallet" active={pathname === "/dashboard/wallet"} />
        </nav>
        <div className="p-4 border-t border-[#e8ecf0] dark:border-[#2d3441] space-y-3">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#f5f7fa] dark:bg-[#1e2128]">
            {user?.photoURL && <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full ring-1 ring-[#e8ecf0] dark:ring-[#2d3441]" />}
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[#2d3748] dark:text-[#e2e8f0]">{user?.displayName || "User"}</p>
              <p className="text-xs text-[#718096] dark:text-[#94a3b8] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2.5 px-4 py-2.5 w-full text-[#718096] dark:text-[#94a3b8] hover:bg-[#f5f7fa] dark:hover:bg-[#1e2128] rounded-lg transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 md:h-16 bg-white/90 dark:bg-[#252932]/90 backdrop-blur-sm border-b border-[#e8ecf0] dark:border-[#2d3441] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 hover:bg-[#f5f7fa] dark:hover:bg-[#2d3441] rounded-lg transition-colors"
          >
            <Menu size={20} className="text-[#718096] dark:text-[#94a3b8]" />
          </button>
          <h2 className="font-medium text-base text-[#2d3748] dark:text-[#e2e8f0] md:hidden">Dashboard</h2>
          <div className="flex items-center gap-2.5">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full ring-1 ring-[#e8ecf0] dark:ring-[#2d3441] md:hidden"
              />
            )}
            <button
              onClick={() => logout()}
              className="p-2 text-[#718096] dark:text-[#94a3b8] hover:bg-[#f5f7fa] dark:hover:bg-[#2d3441] rounded-lg transition-colors md:hidden"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        active
          ? "bg-[#e6f0ff] dark:bg-[#1e2a3a] text-[#4a5568] dark:text-[#cbd5e0] border-l-2 border-[#a8b5ff] dark:border-[#6b7fd7]"
          : "text-[#718096] dark:text-[#94a3b8] hover:bg-[#f5f7fa] dark:hover:bg-[#1e2128]"
      }`}
    >
      <span className={active ? "text-[#6b7fd7] dark:text-[#8b9aff]" : ""}>{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
