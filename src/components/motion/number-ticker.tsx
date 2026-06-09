'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NumberTickerProps {
  value: number;
  className?: string;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  className,
  duration = 1.2,
  delay = 0,
  prefix = '',
  suffix = '',
  decimalPlaces = 0,
}: NumberTickerProps) {
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (latest) =>
    Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(latest)
  );

  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (hasAnimated) {
      spring.set(value);
      return;
    }

    const timeout = setTimeout(() => {
      spring.set(value);
      setHasAnimated(true);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, delay, spring, hasAnimated]);

  // Set initial value for the display transform
  useEffect(() => {
    spring.set(0);
  }, [spring]);

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      <motion.span ref={ref}>{display}</motion.span>
      {suffix}
    </span>
  );
}