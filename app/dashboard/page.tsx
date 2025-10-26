"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Send,
  Inbox,
  Key,
  Settings,
  HelpCircle,
  MessageCircle,
  Clock,
  Shield,
  ArrowRight,
  Activity,
  TrendingUp,
  Users,
} from "lucide-react";
import EmptyState from "../components/shared/EmptyState";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import StatusBadge from "../components/shared/StatusBadge";
import NetworkIndicator from "../components/shared/NetworkIndicator";

// Utils
import {
  setupPassKeys,
  generateStealthKeys,
  createStealthMetaAddress,
  storeUserKeys,
  getUserKeys,
  clearUserKeys,
} from "../../utils/pass-keys-simple";
import {
  generateTestKeys,
  createTestStealthMetaAddress,
  storeTestKeys,
  getTestKeys,
  clearTestKeys,
} from "../../utils/pass-keys-fallback";
import { scanMessages, getMetaAddressFromRegistry } from "../../utils/hedera";

// Types
import { UserKeys, StealthMetaAddress, DecryptedMessage } from "../../types";

export default function DashboardPage() {
  // Hedera wallet
  const { connect, disconnect, accountId, isConnecting, sdk } = useWallet();

  // State
  const [userKeys, setUserKeys] = useState<UserKeys | null>(null);
  const [stealthMetaAddress, setStealthMetaAddress] =
    useState<StealthMetaAddress | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Registry state
  const [userRegistryStatus, setUserRegistryStatus] = useState<{
    isRegistered: boolean;
    metaAddress: string | undefined;
    isLoading: boolean;
    error: string | undefined;
  }>({
    isRegistered: false,
    metaAddress: undefined,
    isLoading: false,
    error: undefined,
  });

  // Load user keys on mount
  useEffect(() => {
    const storedKeys = getUserKeys() || getTestKeys();
    if (storedKeys) {
      setUserKeys(storedKeys);
      const metaAddress = createStealthMetaAddress(storedKeys);
      setStealthMetaAddress(metaAddress);
    }
  }, []);

  // Check registry status when accountId changes
  useEffect(() => {
    const checkRegistryStatus = async () => {
      if (!accountId) {
        setUserRegistryStatus({
          isRegistered: false,
          metaAddress: undefined,
          isLoading: false,
          error: undefined,
        });
        return;
      }

      setUserRegistryStatus((prev) => ({ ...prev, isLoading: true }));

      try {
        if (!sdk) {
          throw new Error("Hedera SDK not available");
        }
        
        // Check if the user's address has a registered meta-address
        const metaAddress = await getMetaAddressFromRegistry(sdk, accountId);
        
        if (metaAddress) {
          setUserRegistryStatus({
            isRegistered: true,
            metaAddress: metaAddress,
            isLoading: false,
            error: undefined,
          });
        } else {
          setUserRegistryStatus({
            isRegistered: false,
            metaAddress: undefined,
            isLoading: false,
            error: undefined,
          });
        }
      } catch (error) {
        setUserRegistryStatus({
          isRegistered: false,
          metaAddress: undefined,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    checkRegistryStatus();
  }, [accountId]);

  // Setup keys mutation
  const setupKeysMutation = useMutation({
    mutationFn: async () => {
      try {
        await setupPassKeys();
        const keys = await generateStealthKeys();
        storeUserKeys(keys);
        return keys;
      } catch (error) {
        console.warn("WebAuthn failed, using test keys:", error);
        const keys = generateTestKeys();
        storeTestKeys(keys);
        return keys;
      }
    },
    onSuccess: (keys) => {
      setUserKeys(keys);
      const metaAddress = createStealthMetaAddress(keys);
      setStealthMetaAddress(metaAddress);
      toast.success("Keys generated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to setup keys: ${error.message}`);
    },
  });

  // Scan messages mutation
  const scanMessagesMutation = useMutation({
    mutationFn: async () => {
      if (!userKeys) {
        throw new Error("User keys not available");
      }

      if (!sdk) {
        throw new Error("Hedera SDK not initialized");
      }

      setIsScanning(true);
      const foundMessages = await scanMessages(userKeys, sdk);
      return foundMessages;
    },
    onSuccess: (foundMessages) => {
      setMessages(foundMessages);
      toast.success(`Found ${foundMessages.length} messages!`);
    },
    onError: (error) => {
      toast.error(`Failed to scan messages: ${error.message}`);
    },
    onSettled: () => {
      setIsScanning(false);
    },
  });

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          Welcome to Whisper
        </h1>
        <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
          Privacy-first anonymous communication using stealth addresses and
          end-to-end encryption
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge variant="outline" icon={Shield} className="px-4 py-2">
            End-to-End Encrypted
          </Badge>
          <Badge variant="outline" icon={MessageCircle} className="px-4 py-2">
            Anonymous Messaging
          </Badge>
          <Badge variant="outline" icon={Key} className="px-4 py-2">
            Stealth Addresses
          </Badge>
          <Badge
            variant="outline"
            className="px-4 py-2 bg-blue-500/20 text-blue-400 border-blue-500/30"
          >
            Hedera Testnet
          </Badge>
        </div>
      </div>

      {!accountId ? (
        <EmptyState
          icon={Shield}
          title="Connect Your Wallet"
          description="Connect your Hedera wallet to start using Whisper for anonymous communication"
          action={{
            label: isConnecting ? "Connecting..." : "Connect Wallet",
            onClick: connect,
          }}
          className="max-w-md mx-auto"
        />
      ) : (
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="interactive" className="group">
              <Link href="/send">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                      <Send className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Send Message</h3>
                      <p className="text-sm text-gray-300">
                        Send anonymous encrypted messages
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card variant="interactive" className="group">
              <Link href="/inbox">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                      <Inbox className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Inbox</h3>
                      <p className="text-sm text-gray-300">
                        {messages.length > 0
                          ? `${messages.length} messages`
                          : "Check for messages"}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card variant="interactive" className="group">
              <Link href="/keys">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                      <Key className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Keys</h3>
                      <p className="text-sm text-gray-300">
                        {userKeys ? "Manage your keys" : "Setup required"}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Key Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!userKeys ? (
                  <EmptyState
                    icon={Key}
                    title="Setup Required"
                    description="Generate your stealth keys to start receiving anonymous messages"
                    action={{
                      label: setupKeysMutation.isPending
                        ? "Setting up..."
                        : "Setup Stealth Keys",
                      onClick: () => setupKeysMutation.mutate(),
                    }}
                    className="py-6"
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <StatusBadge status="success" text="Keys Generated" />
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-200 mb-2">
                        Your Meta-Address
                      </h4>
                      <p className="text-xs text-gray-400 font-mono break-all mb-3">
                        {stealthMetaAddress?.formatted}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            stealthMetaAddress?.formatted || "",
                            "Meta-address"
                          )
                        }
                      >
                        Copy Address
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        status={
                          userRegistryStatus.isRegistered
                            ? "success"
                            : "warning"
                        }
                        text={
                          userRegistryStatus.isRegistered
                            ? "Registered"
                            : "Not Registered"
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <EmptyState
                    icon={MessageCircle}
                    title="No messages yet"
                    description="Share your meta-address to receive anonymous content"
                    className="py-6"
                  />
                ) : (
                  <div className="space-y-3">
                    {messages.slice(0, 3).map((message, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            New Message
                          </p>
                          <p className="text-xs text-gray-300 line-clamp-1">
                            {message.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {messages.length > 3 && (
                      <Button variant="ghost" size="sm" className="w-full">
                        View All Messages ({messages.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/help">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </Link>
            </Button>
            {userKeys && (
              <Button
                variant="outline"
                onClick={() => scanMessagesMutation.mutate()}
                disabled={isScanning || scanMessagesMutation.isPending}
                loading={isScanning || scanMessagesMutation.isPending}
                loadingText="Scanning..."
              >
                Scan for Messages
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
