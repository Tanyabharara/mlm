"use client";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Wallet, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { signInWithGoogle, user, loading } = useAuth();

  return (
    <main className="min-h-screen bg-[#fafbfc] dark:bg-[#1a1d24]">
      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e6f0ff] dark:bg-[#1e2a3a] rounded-full text-[#4a5568] dark:text-[#a8b5ff] text-xs md:text-sm font-medium mb-6 border border-[#c5d0ff]/30 dark:border-[#6b7fd7]/30">
              <span>The Transparency Platform</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 md:mb-6 text-[#2d3748] dark:text-[#e2e8f0] tracking-tight">
              Multi-Level Income Platform
            </h1>
            <p className="text-base md:text-lg text-[#718096] dark:text-[#94a3b8] max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
              Build your network, grow your income, and track everything transparently
            </p>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 bg-[#a8b5ff] dark:bg-[#6b7fd7] text-white rounded-lg font-medium hover:bg-[#8b9aff] dark:hover:bg-[#5a6bc7] transition-all text-sm md:text-base"
              >
                Go to Dashboard
                <ArrowRight size={18} />
              </Link>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 bg-[#a8b5ff] dark:bg-[#6b7fd7] text-white rounded-lg font-medium hover:bg-[#8b9aff] dark:hover:bg-[#5a6bc7] transition-all text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Sign In with Google"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-20">
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              title="Network"
              description="Visualize your team growth in real-time with interactive network trees."
              color="blue"
            />
            <FeatureCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Earn"
              description="Automated income distribution for every new member in your network."
              color="green"
            />
            <FeatureCard
              icon={<Wallet className="w-5 h-5" />}
              title="Wallet"
              description="Transparent wallet with easy withdrawal requests and transaction history."
              color="purple"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  const colorClasses = {
    blue: "bg-[#e6f0ff] dark:bg-[#1e2a3a] text-[#4a7cff] dark:text-[#6b9aff] border-[#c5d0ff] dark:border-[#3a4a6a]",
    green: "bg-[#e6ffe6] dark:bg-[#1e3a2a] text-[#4aaf7c] dark:text-[#6bc99a] border-[#b8e6d3] dark:border-[#2a4a3a]",
    purple: "bg-[#f0e6ff] dark:bg-[#2a1e3a] text-[#8b4aff] dark:text-[#a86bff] border-[#d6c5ff] dark:border-[#4a3a6a]",
  };

  return (
    <div className={`group relative bg-white dark:bg-[#252932] rounded-xl p-5 md:p-6 border border-[#e8ecf0] dark:border-[#2d3441] hover:border-opacity-60 transition-all`}>
      <div className={`inline-flex p-2.5 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} mb-4 border`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-[#2d3748] dark:text-[#e2e8f0]">{title}</h3>
      <p className="text-sm text-[#718096] dark:text-[#94a3b8] leading-relaxed">{description}</p>
    </div>
  );
}
