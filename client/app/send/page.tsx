'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain, usePublicClient, useEnsAddress } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { baseSepolia } from 'wagmi/chains';
import EmptyState from '../components/shared/EmptyState';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import StatusBadge from '../components/shared/StatusBadge';
import { MessageCircle, FileText, DollarSign, Shield, Lock, Upload, AlertCircle } from 'lucide-react';

// Utils
import { generateStealthAddressOfficial } from '../../utils/stealth-sdk-official';
import { validateRecipientInput, validateMessageInput } from '../../utils/validation';
import { prepareMetadata, computeSharedSecret } from '../../utils/encryption';
import { getUserKeys } from '../../utils/pass-keys-simple';

// Types
import { UserKeys, TransactionState, RecipientInfo } from '../../types';

// Constants
import { ANNOUNCE_CONTRACT_ADDRESS } from '../../constants/contracts';

export default function SendPage() {
  const { authenticated, login } = usePrivy();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { data: ensAddress } = useEnsAddress({
    name: '', // Will be set dynamically
    chainId: 1,
    query: { enabled: false }
  });

  // State
  const [userKeys, setUserKeys] = useState<UserKeys | null>(null);

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

  // Send message state
  const [activeTab, setActiveTab] = useState('message');
  const [recipientInput, setRecipientInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Token tip state
  const [tipAmount, setTipAmount] = useState('');
  const [tipToken, setTipToken] = useState('ETH');

  // Transaction state
  const [sendTxState, setSendTxState] = useState<TransactionState>({ status: 'idle' });

  // Write contract for announcements
  const { 
    data: announceHash, 
    error: announceError, 
    isPending: isAnnouncing, 
    writeContract: writeAnnounce 
  } = useWriteContract();

  // Wait for transaction receipts
  const { isLoading: isConfirmingSend, isSuccess: isSendSuccess } = useWaitForTransactionReceipt({
    hash: announceHash,
  });

  // Handle transaction state updates
  useEffect(() => {
    if (isAnnouncing) {
      setSendTxState({ status: 'pending', hash: announceHash });
    } else if (isConfirmingSend) {
      setSendTxState({ status: 'confirming', hash: announceHash });
    } else if (isSendSuccess) {
      setSendTxState({ status: 'confirmed', hash: announceHash });
      toast.success('Message sent successfully!');
      setMessageInput('');
      setRecipientInput('');
    } else if (announceError) {
      setSendTxState({ status: 'failed', error: announceError.message });
      toast.error(`Send failed: ${announceError.message}`);
    }
  }, [isAnnouncing, isConfirmingSend, isSendSuccess, announceError, announceHash]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!recipientInfo?.metaAddress || !messageInput.trim()) {
        throw new Error('Recipient and message are required');
      }

      // Switch to Base Sepolia
      await switchChain({ chainId: baseSepolia.id });

      // Generate stealth address
      const stealthResult = await generateStealthAddressOfficial(recipientInfo.metaAddress);

      // Validate user keys
      if (!userKeys?.viewingPrivateKey) {
        throw new Error('User keys not available. Please generate keys first.');
      }

      // Compute shared secret for encryption
      const sharedSecret = computeSharedSecret(
        userKeys.viewingPrivateKey,
        stealthResult.ephemeralPubKey
      );

      // Encrypt message
      const encryptedMetadata = await prepareMetadata(messageInput, sharedSecret);

      // Announce transaction
      await writeAnnounce({
        address: ANNOUNCE_CONTRACT_ADDRESS,
        abi: [
          {
            name: "announce",
            type: "function",
            inputs: [
              { name: "schemeId", type: "uint256" },
              { name: "stealthAddress", type: "address" },
              { name: "ephemeralPubKey", type: "bytes" },
              { name: "metadata", type: "bytes" }
            ],
            outputs: [],
            stateMutability: "nonpayable"
          }
        ],
        functionName: "announce",
        args: [
          BigInt(1), // schemeId
          stealthResult.stealthAddress as `0x${string}`,
          stealthResult.ephemeralPubKey as `0x${string}`,
          encryptedMetadata as `0x${string}`
        ]
      });
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    }
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
        type: 'invalid',
        isRegistered: false,
        isLoading: false,
        error: validation.error
      });
      return;
    }

    setRecipientInfo({
      address: input,
      type: validation.type,
      isRegistered: false,
      isLoading: true
    });

    // TODO: Implement registry lookup for ETH addresses and ENS
    // For now, only support direct meta-address input
    if (validation.type === 'meta-address') {
      setRecipientInfo({
        address: input,
        metaAddress: input,
        type: 'meta-address',
        isRegistered: true,
        isLoading: false
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
      toast.error('Please enter a valid recipient');
      return;
    }

    const messageValidation = validateMessageInput(messageInput);
    if (!messageValidation.valid) {
      toast.error(messageValidation.errors[0]);
      return;
    }

    sendMessageMutation.mutate();
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Send Anonymous Content
            </h1>
            <p className="text-lg text-gray-300 mb-6">
          Send encrypted messages, files, or token tips anonymously using stealth addresses
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

      {!authenticated ? (
        <EmptyState
          icon={Shield}
          title="Connect Your Wallet"
          description="Connect your wallet to send anonymous content"
          action={{
            label: 'Connect Wallet',
            onClick: login
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="message" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Message
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  File
                </TabsTrigger>
                <TabsTrigger value="tip" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Token Tip
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
                    validation={recipientInfo?.error ? 'error' : recipientInfo?.isRegistered ? 'success' : undefined}
                    errorText={recipientInfo?.error}
                    successText={recipientInfo?.isRegistered ? 'Recipient found' : undefined}
                  />
                  {recipientInfo?.isLoading && (
                    <div className="flex items-center gap-2 mt-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-gray-500">Looking up recipient...</span>
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
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-300 hover:border-gray-400'
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
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 text-green-500 mx-auto" />
                        <p className="font-medium text-white">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <p className="font-medium text-white">Drop your file here</p>
                        <p className="text-sm text-gray-500">or click to browse</p>
                        <Button variant="outline" size="sm">
                          Browse Files
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Lock className="h-4 w-4" />
                    <span>Files are encrypted with AES-256-GCM before sending</span>
                  </div>
                </TabsContent>

                {/* Token Tip Tab */}
                <TabsContent value="tip" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tip-amount">Amount</Label>
                      <Input
                        id="tip-amount"
                        type="number"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        placeholder="0.0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tip-token">Token</Label>
                      <Input
                        id="tip-token"
                        value={tipToken}
                        onChange={(e) => setTipToken(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Token Tips</p>
                        <p className="text-sm text-yellow-700">
                          Token tips will be sent to a generated stealth address. The recipient can claim them using their private keys.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!recipientInfo?.metaAddress || 
                    (activeTab === 'message' && !messageInput.trim()) ||
                    (activeTab === 'file' && !selectedFile) ||
                    (activeTab === 'tip' && !tipAmount.trim()) ||
                    sendMessageMutation.isPending}
                  className="w-full"
                  loading={sendMessageMutation.isPending}
                  loadingText="Sending..."
                >
                  Send {activeTab === 'message' ? 'Message' : activeTab === 'file' ? 'File' : 'Tip'} Anonymously
                </Button>

                {/* Transaction Status */}
                {sendTxState.status !== 'idle' && (
                  <Card variant="outlined" className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge 
                        status={sendTxState.status === 'confirmed' ? 'success' : 
                                sendTxState.status === 'failed' ? 'error' : 'pending'} 
                        text={sendTxState.status} 
                      />
                    </div>
                    {sendTxState.hash && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Transaction Hash:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {sendTxState.hash.slice(0, 10)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(sendTxState.hash!, 'Transaction hash')}
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
