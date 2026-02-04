"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, AlertCircle } from "lucide-react";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess: () => void;
}

export default function WithdrawalModal({ isOpen, onClose, availableBalance, onSuccess }: WithdrawalModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const token = await user.getIdToken();
      const res = await fetch("/api/user/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(amount), walletAddress })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Withdrawal failed");
      }

      alert(data.message);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 max-w-md w-full space-y-8 border border-gray-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black tracking-tighter">Withdraw Funds</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Available Balance
            </label>
            <div className="text-3xl font-black text-[#6C63FF]">
              ${availableBalance.toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Withdrawal Amount
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              BEP-20 Wallet Address (BSC)
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              required
              pattern="^0x[a-fA-F0-9]{40}$"
              className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20"
              placeholder="0x..."
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Withdrawals are processed manually by admin within 24-48 hours. A transaction hash will be provided once processed.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#6C63FF] hover:bg-[#5B52E5] text-white rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Request Withdrawal"}
          </button>
        </form>
      </div>
    </div>
  );
}
