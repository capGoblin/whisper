import React from 'react';
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  loading?: boolean;
  className?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  className = ''
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getVariantConfig = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          confirmVariant: 'destructive' as const,
          titleColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          confirmVariant: 'warning' as const,
          titleColor: 'text-yellow-600'
        };
      case 'info':
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          confirmVariant: 'default' as const,
          titleColor: 'text-blue-600'
        };
      default:
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          confirmVariant: 'default' as const,
          titleColor: 'text-gray-900'
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className={cn('w-full max-w-md mx-4', className)}>
        <CardHeader>
          <CardTitle className={cn('flex items-center gap-2', config.titleColor)}>
            <Icon className={cn('h-5 w-5', config.iconColor)} />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              variant={config.confirmVariant}
              onClick={onConfirm}
              loading={loading}
              disabled={loading}
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
