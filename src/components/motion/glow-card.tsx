'use client';

import { useRef, useCallback } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export function GlowCard({
  children,
  className,
  glowColor = 'oklch(0.68 0.19 52)',
  intensity = 0.18,
}: GlowCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  // Flatten tilt to zero when reduced motion; spring params unchanged
  const rotateX = useTransform(springY, [0, 1], shouldReduceMotion ? [0, 0] : [4, -4]);
  const rotateY = useTransform(springX, [0, 1], shouldReduceMotion ? [0, 0] : [-4, 4]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion) return;
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY, shouldReduceMotion]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  const gradientX = useTransform(springX, [0, 1], ['20%', '80%']);
  const gradientY = useTransform(springY, [0, 1], ['20%', '80%']);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('group/glow relative rounded-xl', className)}
    >
      {/* Animated gradient border */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover/glow:opacity-100"
        style={{
          background: `radial-gradient(circle at ${gradientX} ${gradientY}, ${glowColor} 0%, transparent 60%)`,
          padding: '1px',
        }}
      />

      {/* Glow halo */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 blur-sm transition-opacity duration-300 group-hover/glow:opacity-60"
        style={{
          background: `radial-gradient(circle at ${gradientX} ${gradientY}, ${glowColor.replace(')', ` / ${intensity})`)} 0%, transparent 70%)`,
        }}
      />

      {/* Card content */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
