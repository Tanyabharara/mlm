import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    bsc,
    bscTestnet,
} from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";

export const config = getDefaultConfig({
    appName: 'MLM Platform',
    projectId: 'YOUR_PROJECT_ID', // Replaced with placeholder for now
    chains: [bsc, bscTestnet],
    ssr: true, // If your dApp uses server side rendering (SSR)
});

export const queryClient = new QueryClient();
