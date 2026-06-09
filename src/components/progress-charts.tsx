'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';

// ---------- Project Status Pie Chart ----------

const STATUS_COLORS: Record<string, string> = {
  planning: 'oklch(0.7 0.18 270)',     // primary indigo
  in_progress: 'oklch(0.78 0.16 80)',    // amber
  on_hold: 'oklch(0.65 0.02 270)',       // muted gray
  completed: 'oklch(0.72 0.18 155)',      // emerald
  archived: 'oklch(0.55 0.02 270)',      // dim gray
};

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
};

interface StatusPieChartProps {
  statusCounts: { status: string; count: number }[];
  className?: string;
}

export function StatusPieChart({ statusCounts, className }: StatusPieChartProps) {
  const data = statusCounts.filter((s) => s.count > 0);

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-48 text-muted-foreground text-sm', className)}>
        No projects yet
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? STATUS_COLORS.planning}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, STATUS_LABELS[name as string] ?? name]}
            contentStyle={{
              backgroundColor: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              color: 'var(--color-popover-foreground)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[entry.status] }}
            />
            {STATUS_LABELS[entry.status] ?? entry.status} ({entry.count})
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------- SVG Progress Ring ----------

interface ProgressRingProps {
  value: number;          // 0-100
  size?: number;          // diameter in px
  strokeWidth?: number;
  label?: string;
  className?: string;
  color?: string;
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  className,
  color = 'oklch(0.7 0.18 270)',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value, 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      className={cn('relative inline-flex items-center justify-center', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold tabular-nums">{progress}%</span>
        {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
      </div>
    </motion.div>
  );
}

// ---------- Animated Bar Chart (Weekly Velocity) ----------

interface VelocityData {
  week: string;       // e.g. "W1", "Week 2"
  completed: number;   // tasks completed
  created: number;     // tasks created
}

interface WeeklyVelocityChartProps {
  data: VelocityData[];
  className?: string;
}

export function WeeklyVelocityChart({ data, className }: WeeklyVelocityChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-48 text-muted-foreground text-sm', className)}>
        No task data yet
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: 'oklch(0.65 0.02 270)' }}
            axisLine={{ stroke: 'oklch(1 0 0 / 10%)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'oklch(0.65 0.02 270)' }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              color: 'var(--color-popover-foreground)',
            }}
          />
          <Bar
            dataKey="created"
            name="Created"
            fill="oklch(0.7 0.18 270 / 0.6)"
            radius={[3, 3, 0, 0]}
            animationDuration={800}
          />
          <Bar
            dataKey="completed"
            name="Completed"
            fill="oklch(0.72 0.18 155 / 0.8)"
            radius={[3, 3, 0, 0]}
            animationDuration={800}
            animationBegin={200}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}