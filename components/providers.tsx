"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "react-hot-toast";

import { useState } from "react";
import { WalletProvider } from "@/providers/WalletProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              maxWidth: 350,
              background: "rgba(255, 255, 255, 0.95)",
              color: "#2c3e50",
              border: "1px solid rgba(124, 77, 255, 0.3)",
              backdropFilter: "blur(10px)",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "12px",
              padding: "16px 20px",
              boxShadow: "0 4px 20px rgba(124, 77, 255, 0.2)",
              lineHeight: "1.4",
            },
            duration: 3000,
          }}
        />
        {children}
      </WalletProvider>
    </QueryClientProvider>
  );
}
