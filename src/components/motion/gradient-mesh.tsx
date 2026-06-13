'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GradientMeshProps {
  className?: string;
  colors?: string[];
  speed?: number;
}

export function GradientMesh({
  className,
  colors = [
    'oklch(0.7 0.18 270 / 0.15)',  // primary indigo
    'oklch(0.78 0.16 80 / 0.12)',   // amber accent
    'oklch(0.72 0.14 155 / 0.10)',  // finance emerald
    'oklch(0.68 0.18 290 / 0.12)',  // schedule purple
  ],
  speed = 12,
}: GradientMeshProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {colors.map((color, i) => {
        const staticX = `${20 + i * 15}%`;
        const staticY = `${10 + i * 10}%`;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              background: color,
              width: '60%',
              height: '60%',
            }}
            initial={{
              x: staticX,
              y: staticY,
            }}
            animate={
              shouldReduceMotion
                ? { x: staticX, y: staticY }
                : {
                    x: [
                      `${20 + i * 15}%`,
                      `${30 + i * 10}%`,
                      `${15 + i * 12}%`,
                      `${20 + i * 15}%`,
                    ],
                    y: [
                      `${10 + i * 10}%`,
                      `${25 + i * 8}%`,
                      `${15 + i * 12}%`,
                      `${10 + i * 10}%`,
                    ],
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: speed, repeat: Infinity, ease: 'easeInOut' }
            }
          />
        );
      })}
    </div>
  );
}
