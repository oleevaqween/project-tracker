'use client';

import * as React from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DomainHealthResult, DomainScore } from '@/lib/domain-health';

const DOMAIN_COLORS: Record<string, string> = {
  governance: 'text-indigo-500',
  scope: 'text-sky-500',
  schedule: 'text-violet-500',
  finance: 'text-emerald-500',
  risk: 'text-amber-500',
  resources: 'text-teal-500',
  stakeholders: 'text-rose-500',
};

const STATUS_CONFIG = {
  green: { bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Good' },
  amber: { bg: 'bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Needs Attention' },
  red: { bg: 'bg-red-500/10 border-red-500/30', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'At Risk' },
};

function DomainCard({ domain }: { domain: DomainScore }) {
  const cfg = STATUS_CONFIG[domain.status];
  const colorClass = DOMAIN_COLORS[domain.key] ?? 'text-muted-foreground';

  return (
    <div className={cn('rounded-xl border p-3 space-y-2', cfg.bg)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-semibold', colorClass)}>{domain.name}</span>
        <div className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
          <span className={cn('text-xs font-medium', cfg.text)}>{cfg.label}</span>
        </div>
      </div>
      {/* Score bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{domain.detail}</span>
          <span className="font-medium tabular-nums">{domain.score}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-background/50">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              domain.status === 'green' && 'bg-emerald-500',
              domain.status === 'amber' && 'bg-amber-500',
              domain.status === 'red' && 'bg-red-500',
            )}
            style={{ width: `${domain.score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function DomainHealthDashboard({ health }: { health: DomainHealthResult }) {
  const radarData = health.domains.map(d => ({ domain: d.name, score: d.score }));
  const overallCfg = STATUS_CONFIG[health.overallStatus];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Domain Health</h3>
          <p className="text-xs text-muted-foreground">PMBOK 8 — 7 Performance Domains</p>
        </div>
        <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border', overallCfg.bg, overallCfg.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', overallCfg.dot)} />
          Overall: {health.overallScore}/100
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {health.domains.slice(0, 6).map(d => <DomainCard key={d.key} domain={d} />)}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {health.domains.slice(6).map(d => <DomainCard key={d.key} domain={d} />)}
      </div>

      {/* Radar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Domain Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="currentColor" className="text-border" />
              <PolarAngleAxis
                dataKey="domain"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value) => [`${value ?? 0}/100`, 'Score']}
              />
              <Radar
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
