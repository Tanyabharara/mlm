export const USDT_EXCHANGE_RATE = 1.0; // Mock rate, change to fetch real rate if needed

/**
 * Converts USD amount to USDT based on exchange rate.
 */
export function convertToUSDT(usdAmount: number): number {
    return usdAmount / USDT_EXCHANGE_RATE;
}

/**
 * Recommendations for USDT Wallets.
 */
export const USDT_WALLET_RECOMMENDATIONS = {
    TRC20: ["TronLink", "Trust Wallet"],
    ERC20: ["MetaMask", "Trust Wallet"],
    preferredNetwork: "TRC20 (Low Fees)",
};
