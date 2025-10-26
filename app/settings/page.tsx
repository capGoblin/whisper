'use client';

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Settings, Bell, Shield, Palette, Database, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { authenticated, login, logout } = usePrivy();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Settings state
  const [notifications, setNotifications] = useState({
    newMessages: true,
    transactionUpdates: true,
    securityAlerts: true,
    emailDigest: false
  });
  
  const [privacy, setPrivacy] = useState({
    useRelayer: false,
    proofOfWork: false,
    autoDelete: true,
    deleteAfterDays: 30
  });
  
  const [appearance, setAppearance] = useState({
    theme: 'dark',
    fontSize: 'medium',
    compactMode: false
  });
  
  const [advanced, setAdvanced] = useState({
    rpcUrl: 'https://84532.rpc.thirdweb.com/0146d9ba634727cd97f136a39c52afe1',
    scanInterval: 30,
    maxRetries: 3
  });

  const handleSwitchChain = async () => {
    try {
      await switchChain({ chainId: baseSepolia.id });
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-lg text-gray-600">
          Configure your Whisper experience
        </p>
      </div>

      {!authenticated ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to access settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={login} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Network Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Network Settings
              </CardTitle>
              <CardDescription>
                Configure your blockchain network preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Current Network</Label>
                  <p className="text-sm text-gray-600">
                    {chainId === baseSepolia.id ? 'Base Sepolia' : 'Not connected'} ({chainId || 'N/A'})
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSwitchChain}
                  disabled={chainId === baseSepolia.id}
                >
                  {chainId === baseSepolia.id ? 'Connected' : 'Switch to Base Sepolia'}
                </Button>
              </div>
              
              <div>
                <Label htmlFor="rpc-url">Custom RPC URL</Label>
                <Input
                  id="rpc-url"
                  value={advanced.rpcUrl}
                  onChange={(e) => setAdvanced(prev => ({ ...prev, rpcUrl: e.target.value }))}
                  placeholder="Enter custom RPC URL"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Messages</Label>
                  <p className="text-sm text-gray-600">Get notified when you receive new messages</p>
                </div>
                <Switch
                  checked={notifications.newMessages}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, newMessages: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Transaction Updates</Label>
                  <p className="text-sm text-gray-600">Get notified about transaction status</p>
                </div>
                <Switch
                  checked={notifications.transactionUpdates}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, transactionUpdates: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-gray-600">Get notified about security-related events</p>
                </div>
                <Switch
                  checked={notifications.securityAlerts}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, securityAlerts: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Digest</Label>
                  <p className="text-sm text-gray-600">Receive periodic email summaries</p>
                </div>
                <Switch
                  checked={notifications.emailDigest}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailDigest: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Configure your privacy and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Use Relayer</Label>
                  <p className="text-sm text-gray-600">Route transactions through a relayer to hide your IP</p>
                </div>
                <Switch
                  checked={privacy.useRelayer}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, useRelayer: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Proof of Work</Label>
                  <p className="text-sm text-gray-600">Add computational work to prevent spam</p>
                </div>
                <Switch
                  checked={privacy.proofOfWork}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, proofOfWork: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Delete Messages</Label>
                  <p className="text-sm text-gray-600">Automatically delete messages after a period</p>
                </div>
                <Switch
                  checked={privacy.autoDelete}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, autoDelete: checked }))
                  }
                />
              </div>
              
              {privacy.autoDelete && (
                <div>
                  <Label htmlFor="delete-days">Delete After (Days)</Label>
                  <Input
                    id="delete-days"
                    type="number"
                    value={privacy.deleteAfterDays}
                    onChange={(e) => setPrivacy(prev => ({ 
                      ...prev, 
                      deleteAfterDays: parseInt(e.target.value) || 30 
                    }))}
                    min="1"
                    max="365"
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme</Label>
                <Select 
                  value={appearance.theme} 
                  onValueChange={(value) => setAppearance(prev => ({ ...prev, theme: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Font Size</Label>
                <Select 
                  value={appearance.fontSize} 
                  onValueChange={(value) => setAppearance(prev => ({ ...prev, fontSize: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-gray-600">Use more compact spacing and smaller elements</p>
                </div>
                <Switch
                  checked={appearance.compactMode}
                  onCheckedChange={(checked) => 
                    setAppearance(prev => ({ ...prev, compactMode: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Advanced configuration options for power users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scan-interval">Scan Interval (seconds)</Label>
                <Input
                  id="scan-interval"
                  type="number"
                  value={advanced.scanInterval}
                  onChange={(e) => setAdvanced(prev => ({ 
                    ...prev, 
                    scanInterval: parseInt(e.target.value) || 30 
                  }))}
                  min="10"
                  max="300"
                  className="mt-1"
                />
                <p className="text-sm text-gray-600 mt-1">
                  How often to scan for new messages (10-300 seconds)
                </p>
              </div>
              
              <div>
                <Label htmlFor="max-retries">Max Retries</Label>
                <Input
                  id="max-retries"
                  type="number"
                  value={advanced.maxRetries}
                  onChange={(e) => setAdvanced(prev => ({ 
                    ...prev, 
                    maxRetries: parseInt(e.target.value) || 3 
                  }))}
                  min="1"
                  max="10"
                  className="mt-1"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Maximum number of retry attempts for failed operations
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Account Actions
              </CardTitle>
              <CardDescription>
                Manage your account and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  // TODO: Implement export data functionality
                  toast.info('Export data feature coming soon!');
                }}>
                  Export Data
                </Button>
                <Button variant="outline" onClick={() => {
                  // TODO: Implement clear data functionality
                  toast.info('Clear data feature coming soon!');
                }}>
                  Clear Local Data
                </Button>
                <Button variant="destructive" onClick={logout}>
                  Disconnect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
