import React from 'react';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'confirmed';

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  className?: string;
}

export default function StatusBadge({
  status,
  text,
  className = ''
}: StatusBadgeProps) {
  const statusConfig = {
    success: {
      className: 'bg-green-100 text-green-800 border-green-200',
      text: 'Success'
    },
    warning: {
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      text: 'Warning'
    },
    error: {
      className: 'bg-red-100 text-red-800 border-red-200',
      text: 'Error'
    },
    info: {
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      text: 'Info'
    },
    pending: {
      className: 'bg-orange-100 text-orange-800 border-orange-200',
      text: 'Pending'
    },
    confirmed: {
      className: 'bg-green-100 text-green-800 border-green-200',
      text: 'Confirmed'
    }
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        config.className,
        className
      )}
    >
      {text || config.text}
    </Badge>
  );
}
