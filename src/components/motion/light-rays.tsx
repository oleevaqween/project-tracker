'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';

const RAYS = [
  // Primary: wide, slow; sweeps from sidebar edge across hero
  { angle: 38, delay: 0,   duration: 11, from: 0,    to: 1700, lightWidth: '3px', darkWidth: '2px',   lightOpacity: 0.18, darkOpacity: 0.22 },
  // Secondary: shallower, starts behind sidebar wall, emerges through it
  { angle: 24, delay: 3.5, duration: 16, from: -130, to: 1550, lightWidth: '2px', darkWidth: '2px',   lightOpacity: 0.10, darkOpacity: 0.14 },
  // Steep: faster bounce, anchored at sidebar edge
  { angle: 56, delay: 1.8, duration: 10, from: 0,    to: 1250, lightWidth: '2px', darkWidth: '1.5px', lightOpacity: 0.14, darkOpacity: 0.18 },
  // Ghost: very shallow, ultra-slow drift from deep inside sidebar
  { angle: 19, delay: 7.0, duration: 19, from: -90,  to: 1600, lightWidth: '2px', darkWidth: '1.5px', lightOpacity: 0.08, darkOpacity: 0.10 },
];

export function LightRays() {
  const shouldReduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  if (shouldReduceMotion) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {RAYS.map((ray, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: '-50%',
            width: isDark ? ray.darkWidth : ray.lightWidth,
            height: '200%',
            opacity: isDark ? ray.darkOpacity : ray.lightOpacity,
            rotate: `${ray.angle}deg`,
            transformOrigin: '50% 50%',
            filter: isDark ? 'blur(0.8px) brightness(1.2)' : 'blur(1px)',
            background: `linear-gradient(to bottom, transparent 0%, var(--ray-beam) 18%, var(--ray-beam) 82%, transparent 100%)`,
          }}
          initial={{ x: ray.from }}
          animate={{ x: ray.to }}
          transition={{
            duration: ray.duration,
            delay: ray.delay,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'mirror',
          }}
        />
      ))}
    </div>
  );
}
