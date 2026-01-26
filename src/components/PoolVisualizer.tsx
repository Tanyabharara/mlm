"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User as UserIcon, Target, X, ChevronRight, Sparkles, LayoutGrid, BarChart3 } from "lucide-react";

interface PoolVisualizerProps {
    poolName: string;
    totalMembers: number;
    filledMembers: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function PoolVisualizer({ poolName, totalMembers, filledMembers, isOpen, onClose }: PoolVisualizerProps) {
    const [viewMode, setViewMode] = useState<"bar" | "matrix">("bar");
    const progress = (filledMembers / totalMembers) * 100;

    // Reset view mode when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setViewMode("bar"), 300);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        layout
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        className="bg-white dark:bg-[#1e1e2d] w-full max-w-2xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] border border-white/10"
                    >
                        {/* Modal Header */}
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#1e1e2d] sticky top-0 z-20">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Pool Matrix</h2>
                                <p className="text-sm text-gray-400 font-medium">Global 3×3 Auto Pool ✨</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {viewMode === "matrix" && (
                                    <button
                                        onClick={() => setViewMode("bar")}
                                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white transition-all font-bold text-xs flex items-center gap-2"
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        Back to Stats
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:rotate-90"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 overflow-y-auto no-scrollbar">
                            <AnimatePresence mode="wait">
                                {viewMode === "bar" ? (
                                    <motion.div
                                        key="bar-view"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-10"
                                    >
                                        <div className="text-center">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6C63FF] mb-2 block">Current Progress</span>
                                            <h3 className="text-6xl font-black text-gray-900 dark:text-white">{Math.round(progress)}%</h3>
                                            <p className="text-sm text-gray-400 font-medium mt-2">{filledMembers} / {totalMembers} Slots Occupied</p>
                                        </div>

                                        {/* Large Progress Bar - Clickable to show list */}
                                        <button
                                            onClick={() => setViewMode("matrix")}
                                            className="w-full group relative"
                                        >
                                            <div className="h-16 bg-gray-50 dark:bg-gray-800/50 rounded-3xl overflow-hidden p-2 border border-gray-100 dark:border-gray-800 shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 2, ease: "circOut" }}
                                                    className="h-full bg-gradient-to-r from-[#6C63FF] to-[#8b9aff] rounded-2xl relative flex items-center justify-end px-4"
                                                >
                                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                    <ChevronRight className="text-white w-6 h-6 animate-bounce-x" />
                                                </motion.div>
                                            </div>
                                            <div className="absolute -top-3 right-6 px-4 py-1.5 bg-[#6C63FF] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0">
                                                Click to View Team List
                                            </div>
                                        </button>

                                        {/* Secondary Stats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 text-center">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Next Reward</p>
                                                <p className="text-2xl font-black text-[#4CAF50]">$100</p>
                                            </div>
                                            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 text-center text-center">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Completion</p>
                                                <p className="text-2xl font-black text-gray-900 dark:text-white">{totalMembers - filledMembers} Left</p>
                                            </div>
                                        </div>

                                        <p className="text-center text-xs text-gray-400 font-medium">
                                            Matrix fills globally via FIFO logic. As more users join, your matrix completes automatically! 🚀
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="matrix-view"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-9 gap-4">
                                            {Array.from({ length: totalMembers }).map((_, i) => {
                                                const isFilled = i < filledMembers;
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ delay: i * 0.01 }}
                                                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all relative
                                                            ${isFilled
                                                                ? "bg-[#e6f0ff] border-[#6C63FF]/30 text-[#6C63FF] shadow-md transform"
                                                                : "bg-gray-50 dark:bg-gray-800/50 border-transparent text-gray-200 dark:text-gray-700"}
                                                        `}
                                                    >
                                                        {isFilled ? (
                                                            <UserIcon size={18} className="fill-current" />
                                                        ) : (
                                                            <Users size={14} />
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                        {/* Legend Text */}
                                        <div className="flex items-center justify-center gap-6 p-4 bg-[#f0e6ff]/30 rounded-2xl border border-[#6C63FF]/10 text-[10px] font-black uppercase tracking-widest text-[#6C63FF]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#6C63FF]" />
                                                Filled Slots
                                            </div>
                                            <div className="flex items-center gap-2 opacity-40">
                                                <div className="w-2 h-2 rounded-full bg-gray-400" />
                                                Pending Slots
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
