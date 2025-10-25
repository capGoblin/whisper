'use client';

import React from 'react';
import Link from 'next/link';
import { useWallet } from '@/providers/WalletProvider';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

export default function TopBar() {
  const { connect, disconnect, accountId, isConnecting } = useWallet();

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md w-full">
      <div className="container mx-auto flex justify-between items-center max-w-full">
        <Link href="/" className="text-xl font-bold text-gray-50 hover:text-accent-neon transition-colors">
          Whisper
        </Link>

        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="bg-blue-500 text-white border-transparent whitespace-nowrap">
            Network: Hedera Testnet
          </Badge>
          
          {accountId ? (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-500 text-white border-transparent">
                {accountId.slice(0, 8)}...{accountId.slice(-4)}
              </Badge>
              <Button variant="secondary" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connect} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
