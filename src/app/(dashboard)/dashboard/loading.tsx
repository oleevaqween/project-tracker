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

export default function DashboardLoading() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
        <SkeletonPulse className="h-4 w-24" />
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <SkeletonPulse className="mb-2 h-7 w-56" />
          <SkeletonPulse className="h-4 w-80" />
        </div>

        {/* KPI cards */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <motion.div
            className="rounded-xl border bg-card p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SkeletonPulse className="mb-3 h-4 w-24" />
            <SkeletonPulse className="h-8 w-16" />
          </motion.div>
          <motion.div
            className="rounded-xl border bg-card p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SkeletonPulse className="mb-3 h-4 w-28" />
            <SkeletonPulse className="h-8 w-20" />
          </motion.div>
          <motion.div
            className="rounded-xl border bg-card p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SkeletonPulse className="mb-3 h-4 w-20" />
            <SkeletonPulse className="h-8 w-12" />
          </motion.div>
        </div>

        {/* Main content area */}
        <motion.div
          className="min-h-[40vh] flex-1 rounded-xl border bg-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-6 space-y-4">
            <SkeletonPulse className="h-5 w-32" />
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-4 w-1/2" />
          </div>
        </motion.div>
      </div>
    </>
  );
}