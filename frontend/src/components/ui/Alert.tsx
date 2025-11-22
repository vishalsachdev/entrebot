import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
  icon?: ReactNode;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      title,
      onClose,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      info: {
        container: 'bg-blue-50 border-blue-200 text-blue-900',
        icon: 'text-blue-600',
        defaultIcon: <Info className="h-5 w-5" />,
      },
      success: {
        container: 'bg-green-50 border-green-200 text-green-900',
        icon: 'text-green-600',
        defaultIcon: <CheckCircle className="h-5 w-5" />,
      },
      warning: {
        container: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        icon: 'text-yellow-600',
        defaultIcon: <AlertCircle className="h-5 w-5" />,
      },
      error: {
        container: 'bg-red-50 border-red-200 text-red-900',
        icon: 'text-red-600',
        defaultIcon: <XCircle className="h-5 w-5" />,
      },
    };

    const variantStyles = variants[variant];
    const displayIcon = icon || variantStyles.defaultIcon;

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-lg border p-4',
          variantStyles.container,
          className
        )}
        role="alert"
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className={cn('flex-shrink-0', variantStyles.icon)}>
            {displayIcon}
          </div>
          <div className="flex-1 min-w-0">
            {title && (
              <h5 className="font-semibold mb-1">{title}</h5>
            )}
            <div className="text-sm">{children}</div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity',
                variantStyles.icon
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
