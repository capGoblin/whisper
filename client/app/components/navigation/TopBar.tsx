'use client';

import React from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

export default function TopBar() {
  const { authenticated, login, logout } = usePrivy();
  const chainId = useChainId();

  const isBaseSepolia = chainId === baseSepolia.id;

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md w-full">
      <div className="container mx-auto flex justify-between items-center max-w-full">
        <Link href="/" className="text-xl font-bold text-gray-50 hover:text-accent-neon transition-colors">
          Whisper
        </Link>

        <div className="flex items-center space-x-4">
          {chainId && (
            <Badge variant="outline" className={`
              ${isBaseSepolia ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
              border-transparent
              whitespace-nowrap
            `}>
              Network: {isBaseSepolia ? 'Base Sepolia' : 'Unknown'} ({chainId})
            </Badge>
          )}
          
          {authenticated ? (
            <Button variant="secondary" onClick={logout}>
              Disconnect
            </Button>
          ) : (
            <Button onClick={login}>
              Connect Wallet
            </Button>
          )}
          {/* UserMenu component will go here */}
        </div>
      </div>
    </header>
  );
}
