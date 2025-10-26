"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  MessageCircle,
  FileText,
  Clock,
  Eye,
  Download,
  Copy,
  Inbox,
  Shield,
  RefreshCw,
  Filter,
} from "lucide-react";
import EmptyState from "../components/shared/EmptyState";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import StatusBadge from "../components/shared/StatusBadge";
import CopyButton from "../components/shared/CopyButton";

// Utils
import { scanMessages, downloadFileFromTopic } from "../../utils/hedera";
import { decryptMetadata } from "../../utils/encryption";
import { getUserKeys } from "../../utils/pass-keys-simple";
import { getTestKeys } from "../../utils/pass-keys-fallback";

// Types
import { UserKeys, DecryptedMessage } from "../../types";

export default function InboxPage() {
  const { connect, disconnect, accountId, isConnecting, sdk } = useWallet();

  // State
  const [userKeys, setUserKeys] = useState<UserKeys | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [filter, setFilter] = useState<"all" | "messages" | "files">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "unread">(
    "newest"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] =
    useState<DecryptedMessage | null>(null);

  // Load user keys on mount
  useEffect(() => {
    const storedKeys = getUserKeys() || getTestKeys();
    if (storedKeys) {
      setUserKeys(storedKeys);
    }
  }, []);

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Scan messages mutation
  const scanMessagesMutation = useMutation({
    mutationFn: async () => {
      if (!userKeys) {
        throw new Error("User keys not available");
      }

      if (!sdk) {
        throw new Error("Hedera SDK not initialized");
      }

      // Use Hedera SDK for scanning
      return await scanMessages(userKeys, sdk);
    },
    onSuccess: (scannedMessages) => {
      setMessages(scannedMessages);
      toast.success(`Found ${scannedMessages.length} messages`);
    },
    onError: (error) => {
      toast.error(`Failed to scan messages: ${error.message}`);
    },
  });

  // Filter and sort messages
  const filteredMessages = messages
    .filter((message) => {
      if (filter === "all") return true;
      if (filter === "messages") return message.type === "message";
      if (filter === "files") return message.type === "file";
      return true;
    })
    .filter((message) =>
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest") return b.timestamp - a.timestamp;
      if (sortBy === "oldest") return a.timestamp - b.timestamp;
      if (sortBy === "unread") return a.isRead ? 1 : -1;
      return 0;
    });

  // Handle scan messages
  const handleScanMessages = () => {
    if (!userKeys) {
      toast.error("Please generate your keys first");
      return;
    }
    scanMessagesMutation.mutate();
  };

  // Handle message selection
  const handleMessageSelect = async (message: DecryptedMessage) => {
    const toastId = toast.loading("Decrypting message...");
    
    try {
      // Simulate decryption delay (already decrypted, just for UX)
      await new Promise(resolve => setTimeout(resolve, 500));
      setSelectedMessage(message);
      toast.success("Message decrypted!", { id: toastId });
    } catch (error) {
      toast.error("Failed to decrypt message", { id: toastId });
    }
  };

  // Handle message actions
  const handleMarkAsRead = (message: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m === message ? { ...m, isRead: true } : m))
    );
  };

  const handleDownloadFile = async (message: DecryptedMessage) => {
    // Check if it's a file message by type or content
    const isFileMessage = message.type === "file" || (() => {
      try {
        const content = JSON.parse(message.content);
        return content.type === "file";
      } catch {
        return false;
      }
    })();

    if (!isFileMessage) {
      toast.error("This message is not a file");
      return;
    }

    try {
      // Parse the message content to get file metadata
      let fileMetadata;
      try {
        fileMetadata = JSON.parse(message.content);
      } catch (e) {
        toast.error("Failed to parse file metadata");
        return;
      }

      // Validate metadata
      if (!fileMetadata.topicId || !fileMetadata.fileName || !fileMetadata.mimeType) {
        toast.error("Invalid file metadata");
        return;
      }

      // Show loading toast
      const toastId = toast.loading(`Downloading ${fileMetadata.fileName}...`);

      // Download file from HCS topic
      const blob = await downloadFileFromTopic(
        fileMetadata.topicId,
        fileMetadata.fileName,
        fileMetadata.mimeType,
        fileMetadata.size
      );

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileMetadata.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${fileMetadata.fileName}`, { id: toastId });
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast.error(`Download failed: ${error.message}`);
    }
  };


  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Your Anonymous Inbox
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Receive and manage encrypted messages and files sent to your stealth address on Hedera Testnet.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge variant="outline" icon={Shield} className="px-4 py-2">
            End-to-End Encrypted
          </Badge>
          <Badge variant="outline" icon={Inbox} className="px-4 py-2">
            Anonymous Content
          </Badge>
        </div>
      </div>

      {!accountId ? (
        <EmptyState
          icon={Shield}
          title="Connect Your Wallet"
          description="Connect your Hedera wallet to access your anonymous inbox"
          action={{
            label: isConnecting ? "Connecting..." : "Connect Wallet",
            onClick: connect,
          }}
          className="max-w-md mx-auto"
        />
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Inbox className="h-5 w-5" />
                    Inbox Controls
                  </CardTitle>
                  <CardDescription>
                    Filter, sort, and manage your anonymous content
                  </CardDescription>
                </div>
                <Button
                  onClick={handleScanMessages}
                  disabled={scanMessagesMutation.isPending}
                  loading={scanMessagesMutation.isPending}
                  loadingText="Scanning..."
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan Now
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Filter:</span>
                  <Select
                    value={filter}
                    onValueChange={(value: any) => setFilter(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="messages">Messages</SelectItem>
                      <SelectItem value="files">Files</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Sort:</span>
                  <Select
                    value={sortBy}
                    onValueChange={(value: any) => setSortBy(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-48">
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="text-sm text-gray-500">
                  {filteredMessages.length}{" "}
                  {filteredMessages.length === 1 ? "item" : "items"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle>Received Content</CardTitle>
              <CardDescription>
                Messages and files sent to your stealth address on Hedera Testnet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMessages.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No Content Yet"
                  description="Your inbox is empty. Share your stealth meta-address to receive anonymous messages, files, or tips."
                  className="py-12"
                />
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message, index) => (
                    <Card
                      key={index}
                      variant={message.isRead ? "outlined" : "default"}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        message.isRead
                          ? "opacity-75"
                          : "border-l-4 border-l-blue-500"
                      }`}
                      onClick={() => handleMessageSelect(message)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-2 rounded-lg bg-gray-800 ${
                              message.type === "file"
                                ? "text-green-400"
                                : "text-blue-400"
                            }`}
                          >
                            {message.type === "file" ? (
                              <FileText className="h-5 w-5" />
                            ) : (
                              <MessageCircle className="h-5 w-5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-white">
                                {message.type === "file" 
                                  ? "File from Anonymous" 
                                  : "Message from Anonymous"}
                              </h3>
                              {!message.isRead && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {message.type}
                              </Badge>
                            </div>

                            <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                              {message.type === "file"
                                ? "📄 Encrypted file - Click to view details"
                                : "🔒 Encrypted message - Click to decrypt and view"}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(message.timestamp).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Encrypted
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {(message.type === "file" || (() => {
                              try {
                                const content = JSON.parse(message.content);
                                return content.type === "file";
                              } catch {
                                return false;
                              }
                            })()) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadFile(message);
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMessageSelect(message);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedMessage(null)}
        >
          <Card 
            className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {selectedMessage.type === 'file' ? (
                    <FileText className="h-5 w-5 text-green-400" />
                  ) : (
                    <MessageCircle className="h-5 w-5 text-blue-400" />
                  )}
                  Message Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                >
                  ✕
                </Button>
              </div>
              <CardDescription>
                <Badge variant="outline" className="mt-2">{selectedMessage.type}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Decrypted Content */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  {selectedMessage.type === 'file' ? 'File Information:' : 'Decrypted Content:'}
                </h3>
                <div className="bg-gray-800 p-4 rounded-lg">
                  {selectedMessage.type === 'file' ? (
                    (() => {
                      try {
                        const metadata = JSON.parse(selectedMessage.content);
                        return (
                          <div className="space-y-2 text-white">
                            <div className="flex justify-between">
                              <span className="text-gray-400">File Name:</span>
                              <span className="font-mono">{metadata.fileName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">File Type:</span>
                              <span className="font-mono">{metadata.mimeType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">File Size:</span>
                              <span className="font-mono">{(metadata.size / 1024).toFixed(2)} KB</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Topic ID:</span>
                              <span className="font-mono text-xs">{metadata.topicId}</span>
                            </div>
                          </div>
                        );
                      } catch {
                        return <p className="text-white whitespace-pre-wrap break-words">{selectedMessage.content}</p>;
                      }
                    })()
                  ) : (
                    <p className="text-white whitespace-pre-wrap break-words">{selectedMessage.content}</p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Timestamp:</span>
                  <span className="text-white">{new Date(selectedMessage.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400">Stealth Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-mono truncate max-w-xs">
                      {selectedMessage.stealthAddress}
                    </span>
                    <CopyButton text={selectedMessage.stealthAddress} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">From:</span>
                  <span className="text-white">{selectedMessage.from}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Decryption Status:</span>
                  <Badge variant={selectedMessage.decryptionSuccess ? "success" : "destructive"}>
                    {selectedMessage.decryptionSuccess ? "✓ Decrypted" : "✗ Failed"}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                {(selectedMessage.type === 'file' || (() => {
                  try {
                    const content = JSON.parse(selectedMessage.content);
                    return content.type === "file";
                  } catch {
                    return false;
                  }
                })()) && (
                  <Button onClick={() => handleDownloadFile(selectedMessage)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleMarkAsRead(selectedMessage);
                    toast.success("Marked as read");
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Mark as Read
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    copyToClipboard(selectedMessage.content, "Message");
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
