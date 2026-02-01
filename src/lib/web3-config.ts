import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import {
    bsc,
    bscTestnet,
} from 'wagmi/chains';
import {
    QueryClient,
} from "@tanstack/react-query";

export const config = getDefaultConfig({
    appName: 'MLM Platform',
    projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '21fef48091f12692cad574a6f7753643',
    chains: [bsc, bscTestnet],
    ssr: true,
});

export const queryClient = new QueryClient();
