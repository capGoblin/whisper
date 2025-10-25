import React from 'react';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';

interface NetworkIndicatorProps {
  className?: string;
}

export default function NetworkIndicator({ className = '' }: NetworkIndicatorProps) {
  // Hedera Testnet configuration
  const networkName = 'Hedera Testnet';
  const chainId = 296;
  const isCorrectNetwork = true; // Always true for Hedera Testnet
  
  return (
    <Badge
      variant="outline"
      className={cn(
        'whitespace-nowrap transition-colors',
        isCorrectNetwork
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-red-100 text-red-800 border-red-200',
        className
      )}
    >
      <div className={cn(
        'w-2 h-2 rounded-full mr-2',
        isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'
      )} />
      Network: {networkName} ({chainId})
    </Badge>
  );
}
