import React from 'react';
import { useNetwork } from 'wagmi';
import { Badge } from '../../../components/ui/badge';
import { baseSepolia } from 'wagmi/chains';
import { cn } from '../../../lib/utils';

interface NetworkIndicatorProps {
  className?: string;
}

export default function NetworkIndicator({ className = '' }: NetworkIndicatorProps) {
  const { chain } = useNetwork();
  
  const isCorrectNetwork = chain?.id === baseSepolia.id;
  
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
      Network: {chain?.name || 'Not Connected'} ({chain?.id || 'N/A'})
    </Badge>
  );
}
