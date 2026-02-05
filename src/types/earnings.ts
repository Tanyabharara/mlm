export interface Transaction {
    id: number;
    amount: string;
    type: "CREDIT" | "DEBIT";
    description: string;
    category: string;
    createdAt: string;
}

export interface MilestoneProgress {
    slab: number;
    reward: number;
    currentCount: number;
    targetCount: number;
    isClaimed: boolean;
}

export interface AutoPoolDetail {
    poolId: number;
    name: string;
    entryFee: string;
    status: 'ACTIVE' | 'COMPLETED' | 'LOCKED';
    level1Count: number;
    level2Count: number;
    level3Count: number;
    totalEarned: string;
    isCurrent: boolean;
}

export interface EarningsData {
    totalEarnings: string;
    directIncome: string;
    teamIncome: string;
    poolIncome: string;
    milestoneIncome: string;
    milestones: MilestoneProgress[];
    levelEarnings: string[];
    levelPercentages: {
        L1: number;
        L2: number;
        L3: number;
        L4_10: number;
    };
    allPools: AutoPoolDetail[];
    autoPool: {
        name: string;
        filled: number;
        total: number;
    };
    recentTransactions: Transaction[];
    totalPayouts: string;
    pendingWithdrawals: string;
}
