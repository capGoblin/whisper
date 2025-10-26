import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon' | 'xs';
  className?: string;
  showText?: boolean;
}

export default function CopyButton({
  text,
  label = 'Copy',
  variant = 'outline',
  size = 'default',
  className = '',
  showText = true
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        'transition-all duration-200',
        copied && 'bg-green-100 text-green-700 border-green-300',
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          {showText && 'Copied!'}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-1" />
          {showText && label}
        </>
      )}
    </Button>
  );
}
