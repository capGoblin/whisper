'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useMutation } from '@tanstack/react-query';
import { useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Key, Copy, Download, QrCode, Shield, AlertTriangle, CheckCircle, ExternalLink, Eye, EyeOff, RotateCcw } from 'lucide-react';
import EmptyState from '../components/shared/EmptyState';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import StatusBadge from '../components/shared/StatusBadge';
import CopyButton from '../components/shared/CopyButton';
import ConfirmDialog from '../components/shared/ConfirmDialog';

// Utils
import { generateStealthKeys, createStealthMetaAddress, getUserKeys, storeUserKeys } from '../../utils/pass-keys-simple';
import { useRegisterMetaAddress } from '../../utils/registry';

// Types
import { UserKeys, RegistryStatus } from '../../types';

export default function KeysPage() {
  const { authenticated, login } = usePrivy();
  
  // State
  const [userKeys, setUserKeys] = useState<UserKeys | null>(null);
  const [metaAddress, setMetaAddress] = useState<string>('');
  const [registryStatus, setRegistryStatus] = useState<RegistryStatus>('not-registered');
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);

  // Load existing keys on mount
  useEffect(() => {
    const storedKeys = getUserKeys();
    if (storedKeys) {
      setUserKeys(storedKeys);
      const metaAddrObj = createStealthMetaAddress(storedKeys);
      setMetaAddress(metaAddrObj.formatted);
    }
  }, []);

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Generate keys mutation
  const generateKeysMutation = useMutation({
    mutationFn: async () => {
      const keys = await generateStealthKeys();
      storeUserKeys(keys);
      const metaAddrObj = createStealthMetaAddress(keys);
      const metaAddr = metaAddrObj.formatted;
      setMetaAddress(metaAddr);
      setUserKeys(keys);
      return { keys, metaAddress: metaAddr };
    },
    onSuccess: () => {
      toast.success('Keys generated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to generate keys: ${error.message}`);
    }
  });

  // Register meta address
  const { registerMetaAddress, isPending: isRegistering, error: registerError, hash: registerHash } = useRegisterMetaAddress();
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isRegisterSuccess } = useWaitForTransactionReceipt({
    hash: registerHash,
  });

  // Handle registration transaction states
  useEffect(() => {
    if (isRegisterSuccess) {
      setRegistryStatus('registered');
      toast.success('Meta address registered successfully!');
    } else if (registerError) {
      toast.error(`Registration failed: ${registerError.message}`);
    }
  }, [isRegisterSuccess, registerError]);

  // Handle generate keys
  const handleGenerateKeys = () => {
    generateKeysMutation.mutate();
  };

  // Handle register meta address
  const handleRegisterMetaAddress = async () => {
    if (!metaAddress) {
      toast.error('Please generate keys first');
      return;
    }

    try {
      // Ensure we have a string, not an object
      const addressString = typeof metaAddress === 'string' ? metaAddress : metaAddress.formatted;
      await registerMetaAddress(addressString);
      // Success toast will be shown in useEffect when transaction is confirmed
    } catch (error) {
      toast.error(`Registration failed: ${error.message}`);
    }
  };

  // Handle export keys
  const handleExportKeys = () => {
    if (!userKeys) return;

    const keysData = {
      spendingPrivateKey: userKeys.spendingPrivateKey,
      viewingPrivateKey: userKeys.viewingPrivateKey,
      spendingPublicKey: userKeys.spendingPublicKey,
      viewingPublicKey: userKeys.viewingPublicKey,
      metaAddress: metaAddress,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(keysData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whisper-keys-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Keys exported successfully!');
  };

  // Handle copy meta address
  const handleCopyMetaAddress = () => {
    if (metaAddress) {
      copyToClipboard(metaAddress, 'Meta address');
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Manage Your Stealth Keys
            </h1>
            <p className="text-lg text-gray-300 mb-6">
          Generate, backup, and register your stealth meta-address for anonymous communication.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge variant="outline" icon={Shield} className="px-4 py-2">
            End-to-End Encrypted
          </Badge>
          <Badge variant="outline" icon={Key} className="px-4 py-2">
            Stealth Addresses
          </Badge>
          <Badge variant="outline" icon={CheckCircle} className="px-4 py-2">
            Registry Integration
          </Badge>
        </div>
      </div>

      {!authenticated ? (
        <EmptyState
          icon={Shield}
          title="Connect Your Wallet"
          description="Connect your wallet to manage your stealth keys"
          action={{
            label: 'Connect Wallet',
            onClick: login
          }}
          className="max-w-md mx-auto"
        />
      ) : (
        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Key Status
              </CardTitle>
              <CardDescription>
                Your unique keys for anonymous interactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <StatusBadge 
                    status={userKeys ? 'success' : 'warning'} 
                    text={userKeys ? 'Keys Generated' : 'Keys Not Generated'} 
                    icon={userKeys ? CheckCircle : AlertTriangle}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge 
                    status={registryStatus === 'registered' ? 'success' : 'warning'} 
                    text={registryStatus === 'registered' ? 'Registered to Registry' : 'Not Registered'} 
                    icon={registryStatus === 'registered' ? CheckCircle : AlertTriangle}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Keys */}
          {!userKeys && (
            <Card>
              <CardHeader>
                <CardTitle>Generate New Keys</CardTitle>
                <CardDescription>
                  Create a new stealth key pair for anonymous communication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Key}
                  title="Setup Required"
                  description="Generate your stealth keys to start receiving anonymous messages"
                  action={{
                    label: generateKeysMutation.isPending ? 'Generating...' : 'Generate Stealth Keys',
                    onClick: handleGenerateKeys,
                    loading: generateKeysMutation.isPending,
                  }}
                  className="py-6"
                />
              </CardContent>
            </Card>
          )}

          {/* Meta Address Display */}
          {metaAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Your Stealth Meta-Address</CardTitle>
                <CardDescription>
                  Share this address to receive anonymous messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={typeof metaAddress === 'string' ? metaAddress : metaAddress?.formatted || ''}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <CopyButton 
                        text={typeof metaAddress === 'string' ? metaAddress : metaAddress?.formatted || ''} 
                        label="Meta-address" 
                        size="sm"
                      />
                    </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement QR code generation
                      toast.info('QR code feature coming soon!');
                    }}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Show QR Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement sharing functionality
                      toast.info('Share feature coming soon!');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Details */}
          {userKeys && (
            <Card>
              <CardHeader>
                <CardTitle>Key Pair Details</CardTitle>
                <CardDescription>
                  Your spending and viewing key information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Spending Public Key</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={userKeys.spendingPublicKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <CopyButton 
                      text={userKeys.spendingPublicKey} 
                      label="Spending Public Key" 
                      size="sm"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Viewing Public Key</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={userKeys.viewingPublicKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <CopyButton 
                      text={userKeys.viewingPublicKey} 
                      label="Viewing Public Key" 
                      size="sm"
                    />
                  </div>
                </div>

                {showPrivateKeys && (
                  <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Private Keys (Keep Secure!)</span>
                    </div>
                    <div>
                      <Label>Spending Private Key</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={userKeys.spendingPrivateKey}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <CopyButton 
                          text={userKeys.spendingPrivateKey} 
                          label="Spending Private Key" 
                          size="sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Viewing Private Key</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={userKeys.viewingPrivateKey}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <CopyButton 
                          text={userKeys.viewingPrivateKey} 
                          label="Viewing Private Key" 
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                  >
                    {showPrivateKeys ? 'Hide' : 'Show'} Private Keys
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportKeys}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Keys
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registry Registration */}
          {metaAddress && registryStatus !== 'registered' && (
            <Card>
              <CardHeader>
                <CardTitle>Registry Registration</CardTitle>
                <CardDescription>
                  Register your meta-address on-chain for easy discovery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleRegisterMetaAddress}
                  disabled={!metaAddress || isRegistering || isConfirming}
                  className="w-full"
                >
                  {isRegistering ? 'Registering...' : isConfirming ? 'Confirming...' : 'Register to ERC-6538 Registry'}
                </Button>
                {registerError && (
                  <p className="text-sm text-red-600 mt-2">
                    Registration failed: {registerError.message}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security Warning */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">Security Warning</h3>
                  <p className="text-sm text-yellow-700">
                    Keep your private keys secure. Loss of private keys means permanent loss of access 
                    to received content. Never share your private keys with anyone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
