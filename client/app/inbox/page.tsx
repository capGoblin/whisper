'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/providers/WalletProvider';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { MessageCircle, FileText, DollarSign, Clock, Eye, Download, Copy, Inbox, Shield, RefreshCw, Filter } from 'lucide-react';
import EmptyState from '../components/shared/EmptyState';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import StatusBadge from '../components/shared/StatusBadge';
import CopyButton from '../components/shared/CopyButton';

// Utils
import { scanMessages } from '../../utils/hedera';
import { decryptMetadata } from '../../utils/encryption';
import { getUserKeys } from '../../utils/pass-keys-simple';

// Types
import { UserKeys, DecryptedMessage } from '../../types';

export default function InboxPage() {
  const { connect, disconnect, accountId, isConnecting, sdk } = useWallet();
  
  // State
  const [userKeys, setUserKeys] = useState<UserKeys | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'messages' | 'files' | 'tips'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'unread'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<DecryptedMessage | null>(null);

  // Load user keys on mount
  useEffect(() => {
    const storedKeys = getUserKeys();
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
        throw new Error('User keys not available');
      }
      
      if (!sdk) {
        throw new Error('Hedera SDK not initialized');
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
    }
  });

  // Filter and sort messages
  const filteredMessages = messages
    .filter(message => {
      if (filter === 'all') return true;
      if (filter === 'messages') return message.type === 'message';
      if (filter === 'files') return message.type === 'file';
      if (filter === 'tips') return message.type === 'tip';
      return true;
    })
    .filter(message => 
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      if (sortBy === 'oldest') return a.timestamp - b.timestamp;
      if (sortBy === 'unread') return a.isRead ? 1 : -1;
      return 0;
    });

  // Handle scan messages
  const handleScanMessages = () => {
    if (!userKeys) {
      toast.error('Please generate your keys first');
      return;
    }
    scanMessagesMutation.mutate();
  };

  // Handle message selection
  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
  };

  // Handle message actions
  const handleMarkAsRead = (message: Message) => {
    setMessages(prev => 
      prev.map(m => 
        m === message ? { ...m, isRead: true } : m
      )
    );
  };

  const handleDownloadFile = (message: Message) => {
    if (message.type === 'file' && message.fileData) {
      const blob = new Blob([message.fileData], { type: message.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClaimTip = (message: Message) => {
    if (message.type === 'tip') {
      toast.success('Tip claimed to your wallet!');
      // TODO: Implement actual tip claiming logic
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Your Anonymous Inbox
            </h1>
            <p className="text-lg text-gray-300 mb-6">
          Receive and manage encrypted messages, files, and token tips sent to your stealth address.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge variant="outline" icon={Shield} className="px-4 py-2">
            End-to-End Encrypted
          </Badge>
          <Badge variant="outline" icon={Inbox} className="px-4 py-2">
            Anonymous Content
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
          description="Connect your Hedera wallet to access your anonymous inbox"
          action={{
            label: isConnecting ? 'Connecting...' : 'Connect Wallet',
            onClick: connect
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
                  <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="messages">Messages</SelectItem>
                      <SelectItem value="files">Files</SelectItem>
                      <SelectItem value="tips">Tips</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Sort:</span>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
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
                  {filteredMessages.length} {filteredMessages.length === 1 ? 'item' : 'items'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle>Received Content</CardTitle>
              <CardDescription>
                Messages, files, and tips sent to your stealth address
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
                        message.isRead ? 'opacity-75' : 'border-l-4 border-l-blue-500'
                      }`}
                      onClick={() => handleMessageSelect(message)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg bg-gray-800 ${
                            message.type === 'message' ? 'text-blue-400' :
                            message.type === 'file' ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {message.type === 'message' && <MessageCircle className="h-5 w-5" />}
                            {message.type === 'file' && <FileText className="h-5 w-5" />}
                            {message.type === 'tip' && <DollarSign className="h-5 w-5" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-white">
                                {message.type === 'message' ? 'Message from Anonymous' :
                                 message.type === 'file' ? 'File from Anonymous' : 'Tip Received'}
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
                              {message.type === 'message' ? message.content :
                               message.type === 'file' ? `📄 ${message.fileName || 'encrypted file'}` :
                               `💰 ${message.amount || '0'} ${message.token || 'ETH'} received`}
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
                            {message.type === 'file' && (
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
                            
                            {message.type === 'tip' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClaimTip(message);
                                }}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Claim
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
    </div>
  );
}
