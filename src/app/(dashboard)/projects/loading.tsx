'use client';

import { motion } from 'framer-motion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={`rounded-md bg-muted ${className ?? ''}`}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      className="rounded-xl border bg-card p-6 space-y-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div className="flex items-start justify-between gap-2">
        <SkeletonPulse className="h-5 w-32" />
        <SkeletonPulse className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonPulse className="h-3 w-full" />
      <SkeletonPulse className="h-3 w-2/3" />
      <div className="flex items-center gap-2 pt-1">
        <SkeletonPulse className="h-3 w-14" />
        <SkeletonPulse className="h-3 w-10" />
      </div>
      <div className="pt-1">
        <SkeletonPulse className="h-1.5 w-full rounded-full" />
      </div>
    </motion.div>
  );
}

export default function ProjectsLoading() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
        <SkeletonPulse className="h-4 w-20" />
        <Separator orientation="vertical" className="mx-1 data-vertical:h-3 data-vertical:self-auto" />
        <SkeletonPulse className="h-4 w-16" />
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <SkeletonPulse className="mb-2 h-7 w-28" />
            <SkeletonPulse className="h-4 w-72" />
          </div>
          <SkeletonPulse className="h-9 w-32 rounded-lg" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard index={0} />
          <SkeletonCard index={1} />
          <SkeletonCard index={2} />
          <SkeletonCard index={3} />
          <SkeletonCard index={4} />
          <SkeletonCard index={5} />
        </div>
      </div>
    </>
  );
}