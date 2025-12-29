import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  show: boolean;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
}

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles: Record<ToastType, { bg: string; icon: string; border: string }> =
  {
    success: {
      bg: 'bg-green-50',
      icon: 'text-green-500',
      border: 'border-green-200',
    },
    error: {
      bg: 'bg-red-50',
      icon: 'text-red-500',
      border: 'border-red-200',
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-500',
      border: 'border-amber-200',
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-500',
      border: 'border-blue-200',
    },
  };

const positionClasses: Record<string, string> = {
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

/**
 * Toast notification component for displaying temporary feedback messages.
 * Supports success, error, warning, and info variants with auto-dismiss.
 */
const Toast = ({
  show,
  type = 'info',
  title,
  message,
  duration = 3000,
  onClose,
  position = 'top-center',
}: ToastProps) => {
  const Icon = icons[type];
  const style = styles[type];

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, handleClose]);

  const getAnimationProps = () => {
    const isTop = position.startsWith('top');
    return {
      initial: { opacity: 0, y: isTop ? -50 : 50, scale: 0.9 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: isTop ? -20 : 20, scale: 0.95 },
    };
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          {...getAnimationProps()}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn('fixed z-50', positionClasses[position])}
        >
          <div
            className={cn(
              'rounded-lg shadow-lg border px-4 py-3 flex items-start gap-3 min-w-[280px] max-w-[400px]',
              style.bg,
              style.border
            )}
            role="alert"
            aria-live="polite"
          >
            <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', style.icon)} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 text-sm">{title}</p>
              {message && (
                <p className="text-xs text-neutral-600 mt-0.5 break-words">
                  {message}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
