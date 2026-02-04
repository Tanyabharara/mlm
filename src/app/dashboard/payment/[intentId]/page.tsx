"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Loader2,
    CheckCircle2,
    ShieldCheck,
    ArrowRight,
    ExternalLink,
    Clock,
    AlertCircle
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";

export default function PaymentStatusPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const intentId = params.intentId as string;
    const txHash = searchParams.get("tx");

    const [status, setStatus] = useState<string>("INITIATED");
    const [confirmations, setConfirmations] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const pollStatus = async () => {
            try {
                const res = await fetch(`/api/web3/status/${intentId}`);
                const data = await res.json();

                setStatus(data.status);
                setConfirmations(data.confirmations || 0);
                setIsLoading(false);

                if (data.status === "VERIFIED") {
                    // Success! 
                    setTimeout(() => {
                        window.location.href = "/dashboard/pending";
                    }, 3000);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

        const interval = setInterval(pollStatus, 5000); // Poll every 5 seconds
        pollStatus();

        return () => clearInterval(interval);
    }, [intentId]);

    const steps = [
        { label: "Payment Initiated", done: true },
        { label: "On-Chain Confirmation", done: confirmations > 0, current: status === "PENDING" },
        { label: "12 Node Verification", done: status === "VERIFIED", progress: (Math.min(confirmations, 12) / 12) * 100 },
        { label: "Ledger Finalization", done: status === "VERIFIED" }
    ];

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-[#1e1e2d] rounded-[40px] p-10 shadow-2xl border border-gray-100 dark:border-gray-800 text-center space-y-8"
            >
                <div className="relative w-24 h-24 mx-auto">
                    {status !== "VERIFIED" ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-16 h-16 text-[#6C63FF] animate-spin opacity-20" />
                            <Clock className="w-8 h-8 text-[#6C63FF] absolute" />
                        </div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-[#4CAF50] rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-[#4CAF50]/20"
                        >
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </motion.div>
                    )}
                </div>

                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                        {status === "VERIFIED" ? "Payment Secured!" : "Verifying Payment"}
                    </h1>
                    <p className="text-sm text-gray-400 font-medium mt-2">
                        {status === "VERIFIED"
                            ? "Your plan is active. Redirecting to dashboard..."
                            : "Blockchain verification in progress. Do not close this page."}
                    </p>
                </div>

                <div className="space-y-4 text-left">
                    {steps.map((step, i) => (
                        <div key={i} className="relative">
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black
                                    ${step.done ? "bg-[#4CAF50] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}
                                `}>
                                    {step.done ? "✓" : i + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className={`text-xs font-bold ${step.done ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                                            {step.label}
                                        </p>
                                        {step.progress !== undefined && !step.done && (
                                            <span className="text-[10px] font-black text-[#6C63FF]">{confirmations}/12</span>
                                        )}
                                    </div>
                                    {step.progress !== undefined && !step.done && (
                                        <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${step.progress}%` }}
                                                className="h-full bg-[#6C63FF]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {txHash && (
                    <a
                        href={`https://bscscan.com/tx/${txHash}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#6C63FF] hover:underline"
                    >
                        View on BSCScan
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}

                <div className="pt-4 border-t border-dashed border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <ShieldCheck className="w-4 h-4 text-[#4CAF50]" />
                        Secured by Kafka Logic Pipeline
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
