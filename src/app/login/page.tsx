"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

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
              TrustRefer
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-[#0F172A] font-outfit">
              Log In
            </h1>
            <p className="text-[#64748B] font-medium">
              Sign in with your Google account to continue.
            </p>
          </div>

          <div className="space-y-6">
            <button
              onClick={() => signInWithGoogle()}
              className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-[#6C63FF] hover:bg-[#5B52E5] text-white shadow-xl shadow-[#6C63FF]/20"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                width={20}
                height={20}
              />
              Sign In with Google
            </button>
          </div>

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
