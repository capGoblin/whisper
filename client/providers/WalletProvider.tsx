"use client";

import { HashinalsWalletConnectSDK } from "@hashgraphonline/hashinal-wc";
import { LedgerId } from "@hashgraph/sdk";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface WalletContextType {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  accountId: string | null;
  isConnecting: boolean;
  sdk: HashinalsWalletConnectSDK | null;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;
const APP_METADATA = {
  name: "Whisper",
  description: "Encrypted File Sharing on Hedera Testnet",
  url: typeof window !== "undefined" ? window.location.origin : "",
  icons: ["https://your-app-icon.png"],
};

// Hedera Testnet configuration
const HEDERA_TESTNET_CONFIG = LedgerId.TESTNET;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [sdk, setSdk] = useState<HashinalsWalletConnectSDK | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const initSDK = async () => {
      const instance = HashinalsWalletConnectSDK.getInstance();
      setSdk(instance);

      try {
        // Initialize with Hedera Testnet configuration
        const existingAccount = await instance.initAccount(
          PROJECT_ID,
          APP_METADATA,
          HEDERA_TESTNET_CONFIG
        );
        if (existingAccount) {
          setAccountId(existingAccount.accountId);
        }
      } catch (error) {
        console.error("Failed to init wallet:", error);
      }
    };

    initSDK();
  }, []);

  const connect = async () => {
    if (!sdk) return;
    setIsConnecting(true);
    try {
      const { accountId } = await sdk.connectWallet(
        PROJECT_ID, 
        APP_METADATA, 
        HEDERA_TESTNET_CONFIG
      );
      setAccountId(accountId);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!sdk) return;
    try {
      await sdk.disconnectWallet();
      setAccountId(null);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        connect,
        disconnect,
        accountId,
        isConnecting,
        sdk,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
