export interface Transaction {
    id: number;
    amount: string;
    type: "CREDIT" | "DEBIT";
    description: string;
    category: string;
    createdAt: string;
}

export interface EarningsData {
    totalEarnings: string;
    directIncome: string;
    teamIncome: string;
    poolIncome: string;
    autoPool: {
        name: string;
        filled: number;
        total: number;
    };
    recentTransactions: Transaction[];
}
