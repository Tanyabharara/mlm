export interface Transaction {
    id: number;
    amount: string;
    type: "CREDIT" | "DEBIT";
    description: string;
    createdAt: string;
}

export interface EarningsData {
    totalEarnings: string;
    directIncome: string;
    teamIncome: string;
    recentTransactions: Transaction[];
}
