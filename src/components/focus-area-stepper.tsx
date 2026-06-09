'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { FOCUS_AREAS } from '@/lib/project-helpers';

interface FocusAreaStepperProps {
  currentFocusArea: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { dot: 'h-2.5 w-2.5', label: 'text-[10px]', gap: 'gap-2', connector: 'h-0.5' },
  md: { dot: 'h-3 w-3', label: 'text-xs', gap: 'gap-3', connector: 'h-0.5' },
  lg: { dot: 'h-3.5 w-3.5', label: 'text-sm', gap: 'gap-4', connector: 'h-1' },
} as const;

const focusAreaColors = [
  'bg-violet-500',      // initiating
  'bg-sky-500',          // planning
  'bg-amber-500',        // executing
  'bg-rose-500',         // monitoring_controlling
  'bg-emerald-500',      // closing
] as const;

const focusAreaRingColors = [
  'ring-violet-500/30',
  'ring-sky-500/30',
  'ring-amber-500/30',
  'ring-rose-500/30',
  'ring-emerald-500/30',
] as const;

export function FocusAreaStepper({
  currentFocusArea,
  className,
  size = 'md',
}: FocusAreaStepperProps) {
  const currentIndex = FOCUS_AREAS.findIndex((a) => a.value === currentFocusArea);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center', config.gap, className)}>
      {FOCUS_AREAS.map((area, i) => {
        const isCompleted = i < activeIndex;
        const isCurrent = i === activeIndex;
        const isUpcoming = i > activeIndex;

        return (
          <div key={area.value} className="flex items-center">
            {/* Step dot */}
            <div className="flex flex-col items-center gap-0.5">
              <motion.div
                className={cn(
                  'rounded-full transition-colors',
                  config.dot,
                  isCompleted && focusAreaColors[i],
                  isCurrent && focusAreaColors[i],
                  isUpcoming && 'bg-muted-foreground/25',
                  isCurrent && 'ring-2',
                  isCurrent && focusAreaRingColors[i],
                )}
                initial={false}
                animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
                transition={isCurrent ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
              />
              {size !== 'sm' && (
                <span
                  className={cn(
                    'font-medium leading-none whitespace-nowrap',
                    config.label,
                    isCurrent && 'text-foreground',
                    isCompleted && 'text-muted-foreground',
                    isUpcoming && 'text-muted-foreground/60',
                  )}
                >
                  {area.label}
                </span>
              )}
            </div>

            {/* Connector line between dots */}
            {i < FOCUS_AREAS.length - 1 && (
              <div
                className={cn(
                  'mx-1 w-8 rounded-full transition-colors',
                  config.connector,
                  i < activeIndex ? focusAreaColors[i] : 'bg-muted-foreground/20',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}