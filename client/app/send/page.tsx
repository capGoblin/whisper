'use client';

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { generateStealthAddressForMessage } from '../../utils/generate-stealth-address';
import { announceStealthMessage, prepareAnnouncementData } from '../../utils/announcer';
import { RECIPIENT_META_ADDRESS } from '../../constants/test-data';
import { StealthAddressResult } from '../../types';
import { baseSepolia } from 'wagmi/chains';

export default function SendPage() {
  const { ready, authenticated, login } = usePrivy();
  const [message, setMessage] = useState('hi');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stealthData, setStealthData] = useState<StealthAddressResult | null>(null);

  const { 
    data: hash, 
    error, 
    isPending, 
    writeContract 
  } = useWriteContract();

  const { switchChain } = useSwitchChain();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle successful transaction
  React.useEffect(() => {
    if (isSuccess && hash) {
      toast.success(`Message sent! Transaction: ${hash}`);
      setStealthData(null);
    }
  }, [isSuccess, hash]);

  // Handle transaction error
  React.useEffect(() => {
    if (error) {
      toast.error(`Transaction failed: ${error.message}`);
    }
  }, [error]);

  const generateStealthMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const data = await generateStealthAddressForMessage(RECIPIENT_META_ADDRESS, message);
      setStealthData(data);
      return data;
    },
    onSuccess: () => {
      toast.success('Stealth address generated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to generate stealth address: ${error.message}`);
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  const handleSend = async () => {
    if (!stealthData) {
      toast.error('Please generate stealth address first');
      return;
    }
    
    try {
      // Switch to Base Sepolia first
      console.log('Switching to Base Sepolia...');
      await switchChain({ chainId: baseSepolia.id });
      
      console.log('Attempting transaction with:', {
        address: '0x55649E01B5Df198D18D95b5cc5051630cfD45564',
        args: [
          BigInt(1), // schemeId
          stealthData.stealthAddress,
          stealthData.ephemeralPubKey,
          message
        ]
      });
      
      writeContract({
        address: '0x55649E01B5Df198D18D95b5cc5051630cfD45564', // ANNOUNCE_CONTRACT_ADDRESS
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
          stealthData.stealthAddress as `0x${string}`,
          stealthData.ephemeralPubKey as `0x${string}`,
          `0x${Buffer.from(message).toString('hex')}` as `0x${string}` // metadata
        ]
      });
    } catch (error) {
      console.error('Error in handleSend:', error);
      toast.error(`Failed to switch chain or send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Send Anonymous Message</h1>
            <p className="mt-2 text-sm text-gray-600">
              Send a message to the hardcoded recipient using stealth addresses
            </p>
          </div>

          {!authenticated ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Connect your wallet to send messages</p>
              <button
                onClick={login}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <input
                  type="text"
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your message"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{message.length}/100 characters</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recipient Meta-Address</h3>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {RECIPIENT_META_ADDRESS.formatted}
                </p>
              </div>

              {stealthData && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Generated Stealth Address</h3>
                  <p className="text-xs text-blue-600 font-mono break-all">
                    {stealthData.stealthAddress}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => generateStealthMutation.mutate()}
                  disabled={isGenerating || generateStealthMutation.isPending}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate Stealth Address'}
                </button>

                <button
                  onClick={handleSend}
                  disabled={!stealthData || isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isPending ? 'Confirming...' : 'Send Message'}
                </button>
              </div>

              {hash && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-700">
                    Transaction Hash: {hash}
                  </p>
                </div>
              )}
              
              {isConfirming && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-700">
                    Waiting for confirmation...
                  </p>
                </div>
              )}
              
              {isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-700">
                    Transaction confirmed! Message sent successfully.
                  </p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">
                    Error: {error.message}
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
