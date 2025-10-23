'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain, usePublicClient, useEnsAddress } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { baseSepolia } from 'wagmi/chains';

// Utils
import { setupPassKeys, generateStealthKeys, createStealthMetaAddress, storeUserKeys, getUserKeys, clearUserKeys } from '../utils/pass-keys-simple';
import { generateTestKeys, createTestStealthMetaAddress, storeTestKeys, getTestKeys, clearTestKeys } from '../utils/pass-keys-fallback';
import { scanForSimpleMessages } from '../utils/scan-simple';
import { generateStealthAddressOfficial } from '../utils/stealth-sdk-official';
import { useRegisterMetaAddress, useGetMetaAddressFromRegistry, useRegistryStatus } from '../utils/registry';
import { validateRecipientInput, validateMessageInput } from '../utils/validation';
import { prepareMetadata, decryptMetadata, computeSharedSecret } from '../utils/encryption';

// Types
import { UserKeys, Message, StealthMetaAddress, DecryptedMessage, TransactionState, RecipientInfo } from '../types';

// Constants
import { ANNOUNCE_CONTRACT_ADDRESS } from '../constants/contracts';

export default function HomePage() {
  // Privy auth
  const { ready, authenticated, login, user } = usePrivy();
  
  // Wagmi hooks
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { data: ensAddress } = useEnsAddress({
    name: '', // Will be set dynamically
    chainId: 1,
    query: { enabled: false }
  });
  
  // State
  const [activeTab, setActiveTab] = useState('send');
  const [userKeys, setUserKeys] = useState<UserKeys | null>(null);
  const [stealthMetaAddress, setStealthMetaAddress] = useState<StealthMetaAddress | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  // Send message state
  const [recipientInput, setRecipientInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  
  // Transaction state
  const [sendTxState, setSendTxState] = useState<TransactionState>({ status: 'idle' });
  const [registerTxState, setRegisterTxState] = useState<TransactionState>({ status: 'idle' });
  
  // Registry hooks
  const { registerMetaAddress, isPending: isRegistering, error: registerError, hash: registerHash } = useRegisterMetaAddress();
  const userRegistryStatus = useRegistryStatus(user?.wallet?.address || '');
  
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
  
  const { isLoading: isConfirmingRegister, isSuccess: isRegisterSuccess } = useWaitForTransactionReceipt({
    hash: registerHash,
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
  
  useEffect(() => {
    if (isRegistering) {
      setRegisterTxState({ status: 'pending', hash: registerHash });
    } else if (isConfirmingRegister) {
      setRegisterTxState({ status: 'confirming', hash: registerHash });
    } else if (isRegisterSuccess) {
      setRegisterTxState({ status: 'confirmed', hash: registerHash });
      toast.success('Meta-address registered successfully!');
    } else if (registerError) {
      setRegisterTxState({ status: 'failed', error: registerError.message });
      toast.error(`Registration failed: ${registerError.message}`);
    }
  }, [isRegistering, isConfirmingRegister, isRegisterSuccess, registerError, registerHash]);
  
  // Setup keys mutation
  const setupKeysMutation = useMutation({
    mutationFn: async () => {
      try {
        await setupPassKeys();
        const keys = await generateStealthKeys();
        storeUserKeys(keys);
        return keys;
      } catch (error) {
        console.warn('WebAuthn failed, using test keys:', error);
        const keys = generateTestKeys();
        storeTestKeys(keys);
        return keys;
      }
    },
    onSuccess: (keys) => {
      setUserKeys(keys);
      const metaAddress = createStealthMetaAddress(keys);
      setStealthMetaAddress(metaAddress);
      toast.success('Keys generated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to setup keys: ${error.message}`);
    }
  });
  
  // Scan messages mutation
  const scanMessagesMutation = useMutation({
    mutationFn: async () => {
      if (!userKeys || !publicClient) {
        throw new Error('User keys or public client not available');
      }
      setIsScanning(true);
      const foundMessages = await scanForSimpleMessages(publicClient, userKeys);
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
    }
  });
  
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
      
      // Compute shared secret for encryption
      const sharedSecret = computeSharedSecret(
        userKeys?.viewingPrivateKey || '',
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
  
  // Handle clear keys
  const handleClearKeys = () => {
    clearUserKeys();
    setUserKeys(null);
    setStealthMetaAddress(null);
    setMessages([]);
    toast.success('Keys cleared');
  };
  
  // Handle register to registry
  const handleRegisterToRegistry = () => {
    if (!stealthMetaAddress) {
      toast.error('No meta-address to register');
      return;
    }
    
    registerMetaAddress(stealthMetaAddress.formatted);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };
  
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Stealth Messaging
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Send and receive anonymous messages using stealth addresses on Base Sepolia
          </p>
          <Badge variant="outline" className="mb-4">
            Network: Base Sepolia (Chain ID: {baseSepolia.id})
          </Badge>
        </div>
        
        {!authenticated ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Connect your wallet to start using stealth messaging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={login} className="w-full">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="send">Send Message</TabsTrigger>
              <TabsTrigger value="receive">Receive Messages</TabsTrigger>
            </TabsList>
            
            <TabsContent value="send" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Send Anonymous Message</CardTitle>
                  <CardDescription>
                    Send an encrypted message to a recipient using their stealth meta-address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="recipient">Recipient</Label>
                    <Input
                      id="recipient"
                      value={recipientInput}
                      onChange={(e) => handleRecipientChange(e.target.value)}
                      placeholder="Enter stealth meta-address (st:eth:0x...), ETH address, or ENS name"
                      className="mt-1"
                    />
                    {recipientInfo?.error && (
                      <p className="text-sm text-red-600 mt-1">{recipientInfo.error}</p>
                    )}
                    {recipientInfo?.isLoading && (
                      <p className="text-sm text-gray-500 mt-1">Looking up recipient...</p>
                    )}
                  </div>
                  
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
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!recipientInfo?.metaAddress || !messageInput.trim() || sendMessageMutation.isPending}
                    className="w-full"
                  >
                    {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                  </Button>
                  
                  {sendTxState.status !== 'idle' && (
                    <div className="mt-4 p-3 rounded-md bg-gray-50">
                      <p className="text-sm">
                        Transaction Status: {sendTxState.status}
                        {sendTxState.hash && (
                          <span className="ml-2">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => copyToClipboard(sendTxState.hash!, 'Transaction hash')}
                            >
                              Copy Hash
                            </Button>
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="receive" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Receive Messages</CardTitle>
                  <CardDescription>
                    Set up your stealth keys and scan for encrypted messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!userKeys ? (
                    <div className="text-center">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Setup Required</h3>
                        <p className="text-gray-600 mb-4">
                          Generate your stealth keys to receive anonymous messages
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => setupKeysMutation.mutate()}
                        disabled={setupKeysMutation.isPending}
                        className="w-full"
                      >
                        {setupKeysMutation.isPending ? 'Setting up...' : 'Setup Stealth Keys'}
                      </Button>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        <p>This will create WebAuthn credentials for secure key generation</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h3 className="text-sm font-medium text-blue-700 mb-2">Your Stealth Meta-Address</h3>
                        <p className="text-xs text-blue-600 font-mono break-all">
                          {stealthMetaAddress?.formatted}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(stealthMetaAddress?.formatted || '', 'Meta-address')}
                          >
                            Copy
                          </Button>
                          {!userRegistryStatus.isRegistered && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRegisterToRegistry}
                              disabled={isRegistering}
                            >
                              {isRegistering ? 'Registering...' : 'Register to Registry'}
                            </Button>
                          )}
                        </div>
                        {userRegistryStatus.isRegistered && (
                          <p className="text-xs text-green-600 mt-1">✓ Registered to registry</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => scanMessagesMutation.mutate()}
                          disabled={isScanning || scanMessagesMutation.isPending}
                          className="flex-1"
                        >
                          {isScanning ? 'Scanning...' : 'Scan for Messages'}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={handleClearKeys}
                        >
                          Clear Keys
                        </Button>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          Messages ({messages.length})
                        </h3>
                        
                        {messages.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No messages found</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Try scanning for messages or ask someone to send you a message
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((message, index) => (
                              <div key={index} className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    From: {message.from}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(message.timestamp)}
                                  </span>
                                </div>
                                <p className="text-gray-700">{message.content}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Stealth Address: {message.stealthAddress}
                                </p>
                                {message.decryptionSuccess && (
                                  <Badge variant="outline" className="mt-2">
                                    ✓ Decrypted
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}