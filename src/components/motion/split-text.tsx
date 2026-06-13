'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SplitTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  splitBy?: 'chars' | 'words';
  staggerDelay?: number;
  duration?: number;
  delay?: number;
}

const charVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      delay,
    },
  }),
};

export function SplitText({
  children,
  className,
  as: Tag = 'span',
  splitBy = 'words',
  staggerDelay = 0.03,
  duration = 0.4,
  delay = 0,
}: SplitTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span className={cn(className)}>{children}</span>;
  }

  const units = splitBy === 'chars' ? children.split('') : children.split(' ');

  return (
    <motion.span
      className={cn('relative inline-flex flex-wrap', className)}
      initial="hidden"
      animate="visible"
    >
      {/* Full text for screen readers; animated spans are aria-hidden */}
      <span className="sr-only">{children}</span>
      {units.map((unit, i) => (
        <motion.span
          key={`${unit}-${i}`}
          aria-hidden="true"
          className="inline-block"
          variants={charVariants}
          custom={delay + i * staggerDelay}
        >
          {unit}
          {splitBy === 'words' && i < units.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.span>
  );
}
