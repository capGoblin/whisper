'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { setupPassKeys, generateStealthKeys, createStealthMetaAddress, storeUserKeys } from '../../utils/pass-keys-simple';
import { generateTestKeys, createTestStealthMetaAddress, storeTestKeys, getTestKeys, clearTestKeys } from '../../utils/pass-keys-fallback';
import { scanForSimpleMessages, getUserKeys, clearUserKeys } from '../../utils/scan-simple';
import { UserKeys, Message, StealthMetaAddress } from '../../types';

export default function InboxPage() {
  const publicClient = usePublicClient();
  const [userKeys, setUserKeys] = useState<UserKeys | null>(null);
  const [stealthMetaAddress, setStealthMetaAddress] = useState<StealthMetaAddress | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Load user keys on component mount
  useEffect(() => {
    const storedKeys = getUserKeys() || getTestKeys();
    if (storedKeys) {
      setUserKeys(storedKeys);
      const metaAddress = createStealthMetaAddress(storedKeys);
      setStealthMetaAddress(metaAddress);
    }
  }, []);

  const setupKeysMutation = useMutation({
    mutationFn: async () => {
      try {
        // Try WebAuthn first
        await setupPassKeys();
        const keys = await generateStealthKeys();
        storeUserKeys(keys);
        return keys;
      } catch (error) {
        console.warn('WebAuthn failed, using test keys:', error);
        // Fallback to test keys
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

  const handleClearKeys = () => {
    clearUserKeys();
    setUserKeys(null);
    setStealthMetaAddress(null);
    setMessages([]);
    toast.success('Keys cleared');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Your Inbox</h1>
            <p className="mt-2 text-sm text-gray-600">
              Receive anonymous messages using stealth addresses
            </p>
          </div>

          {!userKeys ? (
            <div className="text-center">
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Setup Required</h2>
                <p className="text-gray-600 mb-4">
                  Generate your stealth keys to receive anonymous messages
                </p>
              </div>
              
              <button
                onClick={() => setupKeysMutation.mutate()}
                disabled={setupKeysMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {setupKeysMutation.isPending ? 'Setting up...' : 'Setup Stealth Keys'}
              </button>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>This will create WebAuthn credentials for secure key generation</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stealth Meta-Address Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-700 mb-2">Your Stealth Meta-Address</h3>
                <p className="text-xs text-blue-600 font-mono break-all">
                  {stealthMetaAddress?.formatted}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Share this address with others so they can send you anonymous messages
                </p>
              </div>

              {/* Scan Controls */}
              <div className="flex space-x-3">
                <button
                  onClick={() => scanMessagesMutation.mutate()}
                  disabled={isScanning || scanMessagesMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isScanning ? 'Scanning...' : 'Scan for Messages'}
                </button>
                
                <button
                  onClick={handleClearKeys}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Clear Keys
                </button>
              </div>

              {/* Messages List */}
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Messages */}
              {scanMessagesMutation.isSuccess && messages.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-700">
                    No messages found. Make sure someone has sent you a message using your stealth meta-address.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
