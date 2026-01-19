"use client";
import { Wallet } from "lucide-react";

export default function WalletPage() {
    return (
        <div className="space-y-5 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold mb-1.5 text-[#2d3748] dark:text-[#e2e8f0] tracking-tight">
                    Wallet
                </h1>
                <p className="text-sm md:text-base text-[#718096] dark:text-[#94a3b8]">Manage your earnings and withdrawals</p>
            </div>

            <div className="bg-white dark:bg-[#252932] rounded-xl border border-[#e8ecf0] dark:border-[#2d3441] p-8 md:p-12 text-center">
                <div className="inline-flex p-3 bg-[#e6f0ff] dark:bg-[#1e2a3a] rounded-full mb-3 border border-[#c5d0ff] dark:border-[#3a4a6a]">
                    <Wallet className="w-6 h-6 text-[#4a7cff] dark:text-[#6b9aff]" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-[#2d3748] dark:text-[#e2e8f0] mb-1.5">Coming Soon</h2>
                <p className="text-sm text-[#718096] dark:text-[#94a3b8]">Wallet features are being developed</p>
            </div>
        </div>
    );
}
