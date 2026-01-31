"use client";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { config, queryClient } from '@/lib/web3-config';

function ReferralCapture() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("referralCode", ref);
    }
  }, [searchParams]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  console.log("Providers mounting, config:", !!config);
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={lightTheme({
          accentColor: '#6C63FF',
          accentColorForeground: 'white',
          borderRadius: 'large',
        })}>
          <AuthProvider>
            <Suspense fallback={null}>
              <ReferralCapture />
            </Suspense>
            {children}
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
