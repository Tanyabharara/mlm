"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  Wallet,
  Users,
  TrendingUp,
  ShieldCheck,
  Ticket,
  Zap,
  BarChart3,
  Globe,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const ADMIN_FALLBACK_CODE = "OTTFY_ADMIN";

export default function Home() {
  const { signInWithGoogle, user, loading } = useAuth();
  const [referralCode, setReferralCode] = useState("");

  const handleSignIn = () => {
    const codeToUse = referralCode.trim() || ADMIN_FALLBACK_CODE;
    signInWithGoogle(codeToUse);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#020617] overflow-hidden">
      {/* 1. Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#6C63FF] rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-[#0F172A] dark:text-white uppercase">ottfy</span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <a href="#" className="hover:text-[#6C63FF] transition-colors">Our Tools</a>
          <a href="#" className="hover:text-[#6C63FF] transition-colors">Tax</a>
          <a href="#" className="hover:text-[#6C63FF] transition-colors">Rewards</a>
          <a href="#" className="hover:text-[#6C63FF] transition-colors">Network</a>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="px-6 py-2.5 bg-[#6C63FF] text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-[#6C63FF]/20 hover:scale-105 transition-transform">Dashboard</Link>
          ) : (
            <button onClick={handleSignIn} className="px-6 py-2.5 text-[#6C63FF] text-xs font-black uppercase tracking-widest border-2 border-[#6C63FF]/10 rounded-full hover:bg-slate-50 transition-colors">Login</button>
          )}
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-800">
              <Zap className="w-3.5 h-3.5 text-[#6C63FF]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#6C63FF]">The No.1 Networking Platform</span>
            </div>

            <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[0.9] text-slate-900 dark:text-white">
              Build Your <br />
              <span className="text-[#6C63FF]">Network.</span> Earn <br />
              Transparently.
            </h1>

            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md">
              A multi-level system designed to help you build wealth through community. Zero hidden fees, total decentralized control.
            </p>

            <div className="flex flex-wrap gap-4">
              <button onClick={handleSignIn} className="px-8 py-4 bg-[#6C63FF] text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-[#6C63FF]/30 hover:-translate-y-1 transition-all flex items-center gap-3">
                Join Now <ArrowRight className="w-4 h-4" />
              </button>
              <button className="px-8 py-4 border-2 border-slate-100 dark:border-white/5 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                View Plan
              </button>
            </div>
          </div>

          {/* Hero Visualization Mockup */}
          <div className="relative h-[500px] w-full hidden lg:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#6C63FF]/5 rounded-full border border-[#6C63FF]/10 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#6C63FF]/5 rounded-full border border-[#6C63FF]/20" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white dark:bg-slate-800 rounded-[28px] shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 z-10"
            >
              <Users className="w-8 h-8 text-[#6C63FF]" />
            </motion.div>

            {/* Orbital Icons */}
            <OrbitalIcon angle={0} icon={<Wallet />} delay={0} />
            <OrbitalIcon angle={120} icon={<TrendingUp />} delay={2} />
            <OrbitalIcon angle={240} icon={<Globe />} delay={4} />
          </div>
        </div>
      </section>

      {/* 3. Feature Grid */}
      <section className="py-24 bg-slate-50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight uppercase">Simplified Network Growth</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Three easy steps to start earning with your community.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              title="Join the Hub"
              description="Our system instantly verifies you to access premium tools and start your and your network tree."
              icon={<Users className="w-6 h-6" />}
            />
            <StepCard
              number="02"
              title="Invite Partners"
              description="Share your unique link with your network and grow your small community into a big team."
              icon={<Globe className="w-6 h-6" />}
              active
            />
            <StepCard
              number="03"
              title="Earn Together"
              description="Every new connection in your network builds automated income that lands in your secure community."
              icon={<BarChart3 className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* 4. Projected Earnings Section */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto space-y-16">
        <div className="space-y-6">
          <h2 className="text-3xl font-black tracking-tight">Projected Earnings</h2>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">
            Choose a plan tailored to your network and start with your team.
            Experience transparent 10-level hierarchy distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Silver Plan */}
          <PlanCard
            name="Silver"
            price="450"
            period="mo"
            accent="gradient-silver"
            features={["Unlimited referrals", "5% commissions on matrix", "Monthly payouts"]}
          />
          {/* Gold Plan (Active) */}
          <PlanCard
            name="Gold"
            price="1,250"
            period="mo"
            accent="gradient-gold"
            active
            features={["Unlimited referrals", "10% commissions on matrix", "Weekly payouts", "Priority support"]}
          />
          {/* Platinum Plan */}
          <PlanCard
            name="Platinum"
            price="3,800"
            period="mo"
            accent="gradient-platinum"
            features={["Unlimited referrals", "20% commissions on matrix", "Daily payouts", "Direct support"]}
          />
        </div>
      </section>

      {/* 5. CTA Footer */}
      <section className="px-6 md:px-12 pb-24 max-w-7xl mx-auto">
        <div className="bg-[#0F172A] rounded-[48px] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#6C63FF]/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#6C63FF]/10 rounded-full blur-[100px]" />

          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Ready to scale your income?</h2>
          <p className="text-slate-400 font-medium max-w-md mx-auto">
            Join thousands of networkers already earning through our transparent DeFi distribution portal.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button onClick={handleSignIn} className="px-10 py-4 bg-[#6C63FF] text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform z-10">Get Started Now</button>
            <button className="px-10 py-4 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-colors z-10">Contact Sales</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function OrbitalIcon({ angle, icon, delay }: { angle: number, icon: React.ReactNode, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        rotate: 360
      }}
      transition={{
        rotate: { duration: 20, repeat: Infinity, ease: "linear", delay },
        opacity: { duration: 1 }
      }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none"
    >
      <div
        className="absolute w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[#6C63FF]"
        style={{
          transform: `rotate(-${angle}deg) translate(180px) rotate(${angle}deg)`,
          left: '50%',
          top: '50%',
          marginLeft: '-24px',
          marginTop: '-24px'
        }}
      >
        {icon}
      </div>
    </motion.div>
  );
}

function StepCard({ number, title, description, icon, active }: any) {
  return (
    <div className={`p-10 rounded-[40px] text-left space-y-6 transition-all border-2 ${active ? 'bg-white dark:bg-slate-900 border-[#6C63FF] shadow-2xl' : 'bg-transparent border-transparent'}`}>
      <span className={`text-[10px] font-black tracking-widest uppercase ${active ? 'text-[#6C63FF]' : 'text-slate-300'}`}>Step {number}</span>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${active ? 'bg-[#6C63FF] text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-sm text-slate-400 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function PlanCard({ name, price, period, accent, active, features }: any) {
  return (
    <div className={`relative p-1 rounded-[40px] ${active ? 'bg-gradient-to-b from-[#6C63FF] to-transparent shadow-2xl' : ''}`}>
      <div className="bg-white dark:bg-[#0F172A] p-10 rounded-[38px] space-y-8 flex flex-col h-full">
        <div className="space-y-4">
          <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Limited Offer</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black">{name}</h3>
            <div className={`w-10 h-6 rounded-full ${accent}`} />
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-900 dark:text-white">${price}</span>
          <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/{period}</span>
        </div>

        <div className="space-y-4 flex-1">
          {features.map((f: string, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{f}</span>
            </div>
          ))}
        </div>

        <button className={`w-full py-4 font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all ${active ? 'bg-[#6C63FF] text-white shadow-xl hover:scale-[1.02]' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-slate-100'}`}>
          Start {name}
        </button>
      </div>
    </div>
  );
}
