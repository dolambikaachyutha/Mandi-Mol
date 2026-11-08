/**
 * Motion configuration, spring presets, and animation variants
 * Compliant with 60fps compositor rules and prefers-reduced-motion.
 */

export const springPresets = {
  snappy: { type: 'spring', stiffness: 380, damping: 26 },
  bouncy: { type: 'spring', stiffness: 420, damping: 16 },
  gentle: { type: 'spring', stiffness: 200, damping: 25 },
};

export const stampSlamVariants = {
  initial: { scale: 2.2, opacity: 0, rotate: -14 },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: -3,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 18,
      mass: 0.8,
    },
  },
  exit: { scale: 0.8, opacity: 0 },
};

export const cardFadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};
