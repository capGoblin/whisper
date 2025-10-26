"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import EmptyState from "../components/shared/EmptyState";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import StatusBadge from "../components/shared/StatusBadge";
import {
  MessageCircle,
  FileText,
  Shield,
  Lock,
  Upload,
  AlertCircle,
} from "lucide-react";

// Utils
import { generateStealthAddressOfficial } from "../../utils/stealth-sdk-official";
import {
  validateRecipientInput,
  validateMessageInput,
} from "../../utils/validation";
import { prepareMetadata, computeSharedSecret } from "../../utils/encryption";
import { getUserKeys } from "../../utils/pass-keys-simple";
import { getTestKeys } from "../../utils/pass-keys-fallback";
import { sendMessage, sendFile } from "../../utils/hedera";

// Types
import { UserKeys, HederaTransactionState, RecipientInfo } from "../../types";

export default function SendPage() {
  const { connect, disconnect, accountId, isConnecting, sdk } = useWallet();

  // State
  const [userKeys, setUserKeys] = useState<UserKeys | null>(null);

  // Load user keys on mount
  useEffect(() => {
    const storedKeys = getUserKeys() || getTestKeys();
    console.log("Stored keys from localStorage:", storedKeys);
    if (storedKeys) {
      setUserKeys(storedKeys);
    } else {
      console.log("No keys found in localStorage");
    }
  }, []);

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Send message state
  const [activeTab, setActiveTab] = useState("message");
  const [recipientInput, setRecipientInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(
    null
  );

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Transaction state
  const [sendTxState, setSendTxState] = useState<HederaTransactionState>({
    status: "idle",
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle transaction state updates
  useEffect(() => {
    if (sendTxState.status === "confirmed") {
      toast.success("Message sent successfully!");
      setMessageInput("");
      setRecipientInput("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else if (sendTxState.status === "failed") {
      toast.error(`Send failed: ${sendTxState.error}`);
    }
  }, [sendTxState]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!recipientInfo?.metaAddress || !messageInput.trim()) {
        throw new Error("Recipient and message are required");
      }

      if (!sdk) {
        throw new Error("SDK not initialized");
      }
      console.log(userKeys);
      if (!userKeys?.viewingPrivateKey) {
        throw new Error("User keys not available. Please generate keys first.");
      }

      setSendTxState({ status: "preparing" });

      // Generate stealth address
      const stealthResult = await generateStealthAddressOfficial(
        recipientInfo.metaAddress
      );

      // Compute shared secret for encryption
      const sharedSecret = computeSharedSecret(
        userKeys.viewingPrivateKey,
        stealthResult.ephemeralPubKey
      );

      // Create message content
      const messageContent = {
        text: messageInput,
        files: selectedFile ? [selectedFile] : [],
        timestamp: Date.now(),
        sender: accountId || "",
        stealthAddress: stealthResult.stealthAddress,
        ephemeralPubKey: stealthResult.ephemeralPubKey,
      };

      // Send message using HashinalWC SDK
      try {
        const metadata = await prepareMetadata(messageContent, sharedSecret);
        const result = await sendMessage(sdk, {
          recipient: recipientInfo.metaAddress,
          content: messageInput,
          stealthAddress: stealthResult.stealthAddress,
          ephemeralPubKey: stealthResult.ephemeralPubKey,
          metadata: metadata,
        });

        setSendTxState({
          status: "confirmed",
          transactionId: result.transactionId,
        });
      } catch (error: any) {
        setSendTxState({
          status: "failed",
          error: error?.message || "Failed to send message",
        });
      }
    },
    onError: (error) => {
      setSendTxState({
        status: "failed",
        error: error.message,
      });
    },
  });

  // Send file mutation
  const sendFileMutation = useMutation({
    mutationFn: async () => {
      if (!recipientInfo?.metaAddress || !selectedFile) {
        throw new Error("Recipient and file are required");
      }

      if (!sdk) {
        throw new Error("SDK not initialized");
      }

      if (!userKeys?.viewingPrivateKey) {
        throw new Error("User keys not available. Please generate keys first.");
      }

      setSendTxState({ status: "preparing" });

      // Generate stealth address
      const stealthResult = await generateStealthAddressOfficial(
        recipientInfo.metaAddress
      );

      // Compute shared secret for encryption
      const sharedSecret = computeSharedSecret(
        userKeys.viewingPrivateKey,
        stealthResult.ephemeralPubKey
      );

      try {
        // Step 1: Upload file to Hedera topic
        console.log("Uploading file to Hedera topic...");
        const fileResult = await sendFile(sdk, {
          file: selectedFile,
          recipient: recipientInfo.metaAddress,
          stealthAddress: stealthResult.stealthAddress,
          ephemeralPubKey: stealthResult.ephemeralPubKey,
        });

        console.log(`File uploaded to topic: ${fileResult.topicId}`);

        // Step 2: Create file metadata for stealth message
        const fileMetadata = {
          type: "file",
          topicId: fileResult.topicId,
          fileName: fileResult.fileName,
          mimeType: fileResult.mimeType,
          size: fileResult.fileSize,
          timestamp: Date.now(),
        };

        // Step 3: Encrypt file metadata
        const metadata = await prepareMetadata(fileMetadata, sharedSecret);

        // Step 4: Send file metadata as stealth message using existing sendMessage
        console.log("Sending file metadata as stealth message...");
        const result = await sendMessage(sdk, {
          recipient: recipientInfo.metaAddress,
          content: `File: ${fileResult.fileName}`,
          stealthAddress: stealthResult.stealthAddress,
          ephemeralPubKey: stealthResult.ephemeralPubKey,
          metadata: metadata,
        });

        setSendTxState({
          status: "confirmed",
          transactionId: result.transactionId,
          topicId: fileResult.topicId,
        });
      } catch (error: any) {
        setSendTxState({
          status: "failed",
          error: error?.message || "Failed to send file",
        });
      }
    },
    onError: (error) => {
      setSendTxState({
        status: "failed",
        error: error.message,
      });
    },
  });

  // Handle recipient input change
  const handleRecipientChange = async (input: string) => {
    setRecipientInput(input);

    if (!input.trim()) {
      setRecipientInfo(null);
      return;
    }

    const validation = validateRecipientInput(input);
    if (!validation.valid) {
      setRecipientInfo({
        address: input,
        type: "meta-address", // Default to meta-address for invalid input
        isRegistered: false,
        isLoading: false,
        error: validation.error,
      });
      return;
    }

    setRecipientInfo({
      address: input,
      type: validation.type,
      isRegistered: false,
      isLoading: true,
    });

    // TODO: Implement registry lookup for ETH addresses and ENS
    // For now, only support direct meta-address input
    if (validation.type === "meta-address") {
      setRecipientInfo({
        address: input,
        metaAddress: input,
        type: "meta-address",
        isRegistered: true,
        isLoading: false,
      });
    }
  };

  // Handle message input change
  const handleMessageChange = (input: string) => {
    setMessageInput(input);
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!recipientInfo?.metaAddress) {
      toast.error("Please enter a valid recipient");
      return;
    }

    // Route to appropriate mutation based on active tab
    if (activeTab === "file") {
      // Validate file is selected
      if (!selectedFile) {
        toast.error("Please select a file to send");
        return;
      }
      sendFileMutation.mutate();
    } else {
      // Validate message input
      const messageValidation = validateMessageInput(messageInput);
      if (!messageValidation.valid) {
        toast.error(messageValidation.errors[0]);
        return;
      }
      sendMessageMutation.mutate();
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Send Anonymous Content
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Send encrypted messages, files, or token tips anonymously using
          stealth addresses
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge variant="outline" icon={Shield} className="px-4 py-2">
            End-to-End Encrypted
          </Badge>
          <Badge variant="outline" icon={Lock} className="px-4 py-2">
            Anonymous
          </Badge>
          <Badge variant="outline" icon={MessageCircle} className="px-4 py-2">
            Multi-Format
          </Badge>
        </div>
      </div>

      {!accountId ? (
        <EmptyState
          icon={Shield}
          title="Connect Your Wallet"
          description="Connect your Hedera wallet to send anonymous content"
          action={{
            label: isConnecting ? "Connecting..." : "Connect Wallet",
            onClick: connect,
          }}
          className="max-w-md mx-auto"
        />
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Compose Content</CardTitle>
            <CardDescription>
              Choose the type of content you want to send anonymously
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="message"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  File
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-6">
                {/* Recipient Input */}
                <div>
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    value={recipientInput}
                    onChange={(e) => handleRecipientChange(e.target.value)}
                    placeholder="Enter stealth meta-address (st:eth:0x...), ETH address, or ENS name"
                    className="mt-1"
                    validation={
                      recipientInfo?.error
                        ? "error"
                        : recipientInfo?.isRegistered
                        ? "success"
                        : undefined
                    }
                    errorText={recipientInfo?.error}
                    successText={
                      recipientInfo?.isRegistered
                        ? "Recipient found"
                        : undefined
                    }
                  />
                  {recipientInfo?.isLoading && (
                    <div className="flex items-center gap-2 mt-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-gray-500">
                        Looking up recipient...
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Tab */}
                <TabsContent value="message" className="space-y-4">
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={messageInput}
                      onChange={(e) => handleMessageChange(e.target.value)}
                      placeholder="Enter your message (max 250 characters)"
                      className="mt-1"
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {messageInput.length}/250 characters
                    </p>
                  </div>
                </TabsContent>

                {/* File Tab */}
                <TabsContent value="file" className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) setSelectedFile(file);
                    }}
                  >
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.txt,.doc,.docx"
                      className="hidden"
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 text-green-500 mx-auto" />
                        <p className="font-medium text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <p className="font-medium text-white">
                          Drop your file here
                        </p>
                        <p className="text-sm text-gray-500">
                          or click to browse
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Browse Files
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Lock className="h-4 w-4" />
                    <span>
                      Files are encrypted with AES-256-GCM before sending
                    </span>
                  </div>
                </TabsContent>

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    !recipientInfo?.metaAddress ||
                    (activeTab === "message" && !messageInput.trim()) ||
                    (activeTab === "file" && !selectedFile) ||
                    sendMessageMutation.isPending ||
                    sendFileMutation.isPending
                  }
                  className="w-full"
                  loading={sendMessageMutation.isPending || sendFileMutation.isPending}
                  loadingText={
                    activeTab === "file" 
                      ? (sendFileMutation.isPending ? "Uploading file..." : "Sending...") 
                      : "Sending..."
                  }
                >
                  Send{" "}
                  {activeTab === "message"
                    ? "Message"
                    : activeTab === "file"
                    ? "File"
                    : ""}{" "}
                  Anonymously
                </Button>

                {/* Transaction Status */}
                {sendTxState.status !== "idle" && (
                  <Card variant="outlined" className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge
                        status={
                          sendTxState.status === "confirmed"
                            ? "success"
                            : sendTxState.status === "failed"
                            ? "error"
                            : "pending"
                        }
                        text={sendTxState.status}
                      />
                    </div>
                    {sendTxState.transactionId && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Transaction ID:
                        </span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {sendTxState.transactionId.slice(0, 10)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              sendTxState.transactionId!,
                              "Transaction ID"
                            )
                          }
                        >
                          Copy
                        </Button>
                      </div>
                    )}
                    {sendTxState.topicId && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-600">Topic ID:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {sendTxState.topicId}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(sendTxState.topicId!, "Topic ID")
                          }
                        >
                          Copy
                        </Button>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
