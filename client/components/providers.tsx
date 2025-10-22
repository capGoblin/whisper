'use client';

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "@privy-io/wagmi";
import { Toaster } from "react-hot-toast";
import { configFront } from "../lib/wallet";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "placeholder-app-id"}
      config={{
        appearance: {
          walletChainType: "ethereum-only",
          walletList: ["metamask", "rainbow", "wallet_connect"],
        },
        defaultChain: {
          id: 84532, // Base Sepolia
          name: "Base Sepolia",
          network: "base-sepolia",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ["https://sepolia.base.org"],
            },
            public: {
              http: ["https://sepolia.base.org"],
            },
          },
          blockExplorers: {
            default: {
              name: "BaseScan",
              url: "https://sepolia.basescan.org",
            },
          },
          testnet: true,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={configFront}>
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
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
