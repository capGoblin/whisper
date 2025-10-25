import * as React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  validation?: 'success' | 'error' | 'warning';
  helperText?: string;
  errorText?: string;
  successText?: string;
  warningText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    validation, 
    helperText, 
    errorText, 
    successText, 
    warningText,
    ...props 
  }, ref) => {
    const validationClasses = {
      success: 'border-green-500 focus-visible:ring-green-500',
      error: 'border-red-500 focus-visible:ring-red-500',
      warning: 'border-yellow-500 focus-visible:ring-yellow-500'
    };

    const getStatusIcon = () => {
      switch (validation) {
        case 'success':
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'error':
          return <AlertCircle className="h-4 w-4 text-red-500" />;
        case 'warning':
          return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        default:
          return null;
      }
    };

    const getStatusText = () => {
      if (validation === 'success' && successText) return successText;
      if (validation === 'error' && errorText) return errorText;
      if (validation === 'warning' && warningText) return warningText;
      return helperText;
    };

    const statusText = getStatusText();

    return (
      <div className="w-full">
        <div className="relative">
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              validation && validationClasses[validation],
              className
            )}
            ref={ref}
            {...props}
          />
          {validation && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {getStatusIcon()}
            </div>
          )}
        </div>
        {statusText && (
          <p className={cn(
            'mt-1 text-xs',
            validation === 'success' && 'text-green-600',
            validation === 'error' && 'text-red-600',
            validation === 'warning' && 'text-yellow-600',
            !validation && 'text-gray-500'
          )}>
            {statusText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
