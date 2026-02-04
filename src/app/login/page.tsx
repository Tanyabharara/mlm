"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState<{ type: 'error' | 'loading', message: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Signing in...' });
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Login failed' });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white font-sans">
      {/* Left Side - Visual & Brand */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[#E5F3F3] p-12 relative overflow-hidden">
        <div className="max-w-md w-full space-y-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] overflow-hidden shadow-2xl mb-12 aspect-square relative bg-white flex items-center justify-center p-8"
          >
            <img
              src="/growth-graphic.png"
              alt="Growth Chart"
              width={400}
              height={400}
              className="object-contain w-full h-full"
            />
          </motion.div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-[#0F172A] font-outfit">
              Welcome Back
            </h2>
            <p className="text-[#64748B] text-lg font-medium leading-relaxed">
              Sign in to access your partner dashboard and manage your network.
            </p>
          </div>
          <div className="flex justify-center gap-2 mt-8">
            <div className="w-8 h-1.5 rounded-full bg-[#6C63FF]" />
            <div className="w-2 h-1.5 rounded-full bg-[#6C63FF]/20" />
            <div className="w-2 h-1.5 rounded-full bg-[#6C63FF]/20" />
          </div>
        </div>
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#6C63FF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#6C63FF]/10 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 bg-white relative">
        <div className="max-w-md w-full space-y-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#6C63FF] rounded-xl flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-[#0F172A] font-outfit">
              OTTFY
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-[#0F172A] font-outfit">
              Log In
            </h1>
            <p className="text-[#64748B] font-medium">
              Sign in with your email and password to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#64748B]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full px-6 py-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl text-[#0F172A] font-bold focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#64748B]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-6 py-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl text-[#0F172A] font-bold focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition-all"
                />
              </div>
            </div>

            {status && (
              <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center ${status.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-[#6C63FF]/10 text-[#6C63FF]'
                }`}>
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={status?.type === 'loading'}
              className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-[#6C63FF] hover:bg-[#5B52E5] text-white shadow-xl shadow-[#6C63FF]/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {status?.type === 'loading' ? "Signing In..." : "Log In 🚀"}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#F1F5F9]"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-white px-4 text-[#94A3B8]">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="w-full py-4 border-2 border-[#F1F5F9] rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-[#F8FAFC] text-[#0F172A]"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                width={16}
                height={16}
              />
              Sign In with Google
            </button>
          </form>

          <div className="pt-8 flex flex-col items-center gap-6">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-1.5 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                <ShieldCheck size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Secure
                </span>
              </div>
              <div className="flex items-center gap-1.5 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                <LockKeyhole size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  End-to-End
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold text-[#64748B]">
              Don&apos;t have an account?{" "}
              <Link
                href="/"
                className="text-[#6C63FF] font-black hover:underline transition-all"
              >
                Sign Up Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
