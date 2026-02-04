"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminWithdrawalsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch all withdrawal requests
  const { data: withdrawalsData, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const token = await user!.getIdToken();
      const res = await fetch("/api/admin/withdrawals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch withdrawals");
      return res.json();
    },
    enabled: !!user,
  });

  // Mutation for approving/rejecting withdrawals
  const processMutation = useMutation({
    mutationFn: async ({ withdrawalId, action, txHash, rejectionReason }: any) => {
      const token = await user!.getIdToken();
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ withdrawalId, action, txHash, rejectionReason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to process withdrawal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      setProcessingId(null);
      setTxHash("");
      setRejectionReason("");
      alert("Withdrawal processed successfully!");
    },
    onError: (error: any) => {
      alert(error.message);
    },
  });

  const filteredWithdrawals = withdrawalsData?.withdrawals?.filter((w: any) => {
    if (filter === "all") return true;
    return w.status === filter;
  }) || [];

  const handleApprove = (withdrawalId: string) => {
    const hash = prompt("Enter transaction hash (0x...):");
    if (!hash) return;
    processMutation.mutate({ withdrawalId, action: "APPROVE", txHash: hash });
  };

  const handleReject = (withdrawalId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    processMutation.mutate({ withdrawalId, action: "REJECT", rejectionReason: reason });
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Withdrawal Management</h1>
        <p className="text-slate-400 font-medium">Review and process user withdrawal requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total</span>
            <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl">
              <AlertCircle size={16} className="text-slate-400" />
            </div>
          </div>
          <p className="text-3xl font-black">{withdrawalsData?.withdrawals?.length || 0}</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/5 rounded-[32px] p-6 border border-amber-100 dark:border-amber-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-600">Pending</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-xl">
              <Clock size={16} className="text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600">
            {withdrawalsData?.withdrawals?.filter((w: any) => w.status === "PENDING").length || 0}
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-500/5 rounded-[32px] p-6 border border-emerald-100 dark:border-emerald-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Approved</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600">
            {withdrawalsData?.withdrawals?.filter((w: any) => w.status === "APPROVED").length || 0}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-500/5 rounded-[32px] p-6 border border-red-100 dark:border-red-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-red-600">Rejected</span>
            <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-xl">
              <XCircle size={16} className="text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-red-600">
            {withdrawalsData?.withdrawals?.filter((w: any) => w.status === "REJECTED").length || 0}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {["all", "PENDING", "APPROVED", "REJECTED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === f
                ? "bg-[#6C63FF] text-white"
                : "bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 hover:border-[#6C63FF]/20"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  User ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  Wallet Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal: any) => (
                  <tr key={withdrawal.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-sm">{withdrawal.userId}</td>
                    <td className="px-6 py-4 font-black text-lg">${Number(withdrawal.amount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-slate-100 dark:bg-white/5 px-2 py-1 rounded font-mono">
                          {withdrawal.walletAddress.slice(0, 6)}...{withdrawal.walletAddress.slice(-4)}
                        </code>
                        <a
                          href={`https://testnet.bscscan.com/address/${withdrawal.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6C63FF] hover:text-[#5B52E5]"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                          withdrawal.status === "PENDING"
                            ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600"
                            : withdrawal.status === "APPROVED"
                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600"
                            : "bg-red-100 dark:bg-red-500/10 text-red-600"
                        }`}
                      >
                        {withdrawal.status === "PENDING" && <Clock size={12} />}
                        {withdrawal.status === "APPROVED" && <CheckCircle2 size={12} />}
                        {withdrawal.status === "REJECTED" && <XCircle size={12} />}
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(withdrawal.createdAt?.seconds * 1000 || withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {withdrawal.status === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={processMutation.isPending}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal.id)}
                            disabled={processMutation.isPending}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : withdrawal.status === "APPROVED" && withdrawal.txHash ? (
                        <a
                          href={`https://testnet.bscscan.com/tx/${withdrawal.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#6C63FF] hover:text-[#5B52E5] text-xs font-bold"
                        >
                          View TX <ExternalLink size={12} />
                        </a>
                      ) : withdrawal.status === "REJECTED" ? (
                        <span className="text-xs text-slate-400">{withdrawal.rejectionReason || "Rejected"}</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
