import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationProps {
  show: boolean;
  milestone: string;
  description?: string;
  onComplete?: () => void;
}

/**
 * Celebration component that fires confetti and shows a toast notification
 * when a milestone is achieved.
 */
const Celebration = ({
  show,
  milestone,
  description,
  onComplete,
}: CelebrationProps) => {
  const fireConfetti = useCallback(() => {
    // Fire confetti from both sides
    const defaults = {
      origin: { y: 0.7 },
      spread: 55,
      ticks: 100,
      gravity: 1.2,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    };

    // Left side
    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: 0.2, y: 0.6 },
      angle: 60,
    });

    // Right side
    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: 0.8, y: 0.6 },
      angle: 120,
    });

    // Center burst
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 60,
        origin: { x: 0.5, y: 0.5 },
        spread: 100,
      });
    }, 150);
  }, []);

  useEffect(() => {
    if (show) {
      fireConfetti();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, fireConfetti, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-white rounded-lg shadow-xl border border-primary-200 px-6 py-4 flex items-center gap-3 min-w-[300px]">
            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-xl" role="img" aria-label="trophy">
                🏆
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-900 text-sm">
                Milestone Achieved!
              </h4>
              <p className="text-primary-600 font-medium">{milestone}</p>
              {description && (
                <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onComplete}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Dismiss"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Celebration;
