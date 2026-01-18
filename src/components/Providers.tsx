"use client";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

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
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
          <Suspense fallback={null}>
            <ReferralCapture />
          </Suspense>
          {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
