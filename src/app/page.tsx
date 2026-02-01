"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
    ShieldCheck,
    ArrowRight,
    Mail,
    Lock,
    UserPlus,
    CheckCircle2,
    Globe,
    LockKeyhole,
    X
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
    const { signInWithGoogle, user } = useAuth();
    const [referralCode, setReferralCode] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [referrerName, setReferrerName] = useState("");

    const searchParams = useSearchParams();

    useEffect(() => {
        const urlRef = searchParams.get("ref");
        const savedRef = localStorage.getItem("referralCode");

        if (urlRef) {
            setReferralCode(urlRef.toUpperCase());
        } else if (savedRef) {
            setReferralCode(savedRef);
        }
    }, [searchParams]);

    useEffect(() => {
        const verifyCode = async () => {
            if (referralCode.length >= 6) {
                setIsVerifying(true);
                try {
                    const res = await fetch(`/api/auth/verify-referral?code=${referralCode}`);
                    const data = await res.json();
                    if (data.valid) {
                        setIsVerified(true);
                        setReferrerName(data.name);
                        localStorage.setItem("referralCode", referralCode.toUpperCase());
                    } else {
                        setIsVerified(false);
                        setReferrerName("");
                    }
                } catch (e) {
                    setIsVerified(false);
                } finally {
                    setIsVerifying(false);
                }
            } else {
                setIsVerified(false);
                setReferrerName("");
            }
        };

        const timeoutId = setTimeout(verifyCode, 500);
        return () => clearTimeout(timeoutId);
    }, [referralCode]);

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white font-sans">
            {/* Left Side - Visual & Brand Branding */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-[#E5F3F3] p-12 relative overflow-hidden">
                <div className="max-w-md w-full space-y-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[32px] overflow-hidden shadow-2xl mb-12 aspect-square relative bg-white flex items-center justify-center p-8"
                    >
                        <Image
                            src="/growth-graphic.png"
                            alt="Growth Chart"
                            width={400}
                            height={400}
                            className="object-contain"
                        />
                    </motion.div>

                    <div className="space-y-4">
                        <h2 className="text-3xl font-black tracking-tight text-[#0F172A] font-outfit">
                            Exclusive Community Access
                        </h2>
                        <p className="text-[#64748B] text-lg font-medium leading-relaxed">
                            Join our trust-based financial ecosystem. Membership is exclusive and requires a valid referral from an existing partner.
                        </p>
                    </div>

                    <div className="flex justify-center gap-2 mt-8">
                        <div className="w-8 h-1.5 rounded-full bg-[#6C63FF]" />
                        <div className="w-2 h-1.5 rounded-full bg-[#6C63FF]/20" />
                        <div className="w-2 h-1.5 rounded-full bg-[#6C63FF]/20" />
                    </div>
                </div>

                {/* Subtle decorative circles */}
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#6C63FF]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#6C63FF]/10 rounded-full blur-3xl" />
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 bg-white relative">
                <div className="max-w-md w-full space-y-10">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-[#6C63FF] rounded-xl flex items-center justify-center text-white">
                            <ShieldCheck size={24} />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-[#0F172A] font-outfit">TrustRefer</span>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tight text-[#0F172A] font-outfit">
                            Create Account
                        </h1>
                        <p className="text-[#64748B] font-medium">
                            Join the restricted auto-pool network by entering your details below.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-4">
                            {/* Referral ID */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-black uppercase tracking-widest text-[#64748B]">
                                        Mandatory Referral ID
                                    </label>
                                    <span className="text-[10px] font-bold text-[#6C63FF] uppercase tracking-wider">Required to join</span>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserPlus size={18} className={`transition-colors ${isVerified ? 'text-[#4CAF50]' : 'text-[#94A3B8] group-focus-within:text-[#6C63FF]'}`} />
                                    </div>
                                    <input
                                        type="text"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value)}
                                        placeholder="REF-7721-R9"
                                        className={`block w-full pl-12 pr-24 py-4 bg-[#F8FAFC] border rounded-2xl text-[#0F172A] font-bold focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 transition-all ${isVerified ? 'border-[#4CAF50] focus:border-[#4CAF50]' : 'border-[#F1F5F9] focus:border-[#6C63FF]'}`}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                        {isVerifying ? (
                                            <div className="w-5 h-5 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
                                        ) : isVerified ? (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#4CAF50]/10 rounded-full">
                                                <CheckCircle2 size={12} className="text-[#4CAF50]" />
                                                <span className="text-[10px] font-black text-[#4CAF50] uppercase tracking-tighter">Verified</span>
                                            </div>
                                        ) : referralCode.length >= 6 ? (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-full">
                                                <X size={12} className="text-red-500" />
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Invalid</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                {isVerified && referrerName && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-[10px] font-bold text-[#4CAF50] px-1"
                                    >
                                        Invited by: {referrerName}
                                    </motion.p>
                                )}
                            </div>

                            {/* Email Address */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-[#64748B]">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-[#94A3B8] group-focus-within:text-[#6C63FF] transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="block w-full pl-12 py-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl text-[#0F172A] font-bold focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition-all"
                                    />
                                </div>
                            </div>

                            {/* Create Password */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-[#64748B]">
                                    Create Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-[#94A3B8] group-focus-within:text-[#6C63FF] transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="block w-full pl-12 py-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl text-[#0F172A] font-bold focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 focus:border-[#6C63FF] transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-center text-[#94A3B8] leading-relaxed">
                            By signing up, you agree to our <Link href="#" className="underline">Terms of Service</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
                        </p>

                        <button
                            onClick={() => isVerified && signInWithGoogle(referralCode)}
                            disabled={!isVerified}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isVerified
                                ? "bg-[#6C63FF] hover:bg-[#5B52E5] text-white shadow-xl shadow-[#6C63FF]/20"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                        >
                            {isVerified ? "Join Now 🚀" : "Enter Referral to Join"}
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
                            onClick={() => isVerified && signInWithGoogle(referralCode)}
                            disabled={!isVerified}
                            className={`w-full py-4 border-2 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isVerified
                                ? "border-[#F1F5F9] hover:bg-[#F8FAFC] text-[#0F172A]"
                                : "border-slate-100 text-slate-300 cursor-not-allowed"
                                }`}
                        >
                            <img
                                src="https://www.google.com/favicon.ico"
                                alt="Google"
                                width={16}
                                height={16}
                                className={isVerified ? "" : "opacity-20"}
                            />
                            Sign In with Google
                        </button>
                    </form>

                    <div className="pt-8 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-1.5 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                                <ShieldCheck size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Secure</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                                <LockKeyhole size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest">End-to-End</span>
                            </div>
                        </div>

                        <p className="text-xs font-semibold text-[#64748B]">
                            Already have an account?{" "}
                            <Link href="#" className="text-[#6C63FF] font-black hover:underline transition-all">
                                Log In Here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
