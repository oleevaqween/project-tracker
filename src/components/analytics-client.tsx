'use client';

import { StaggerContainer, StaggerItem, NumberTicker } from '@/components/motion';
import { PMBOKGuide } from '@/components/pmbok';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProgressRing, WeeklyVelocityChart } from '@/components/progress-charts';
import {
  FolderKanbanIcon,
  ListTodoIcon,
  AlertTriangleIcon,
  ActivityIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface ProjectHealth {
  id: number;
  name: string;
  status: string;
  focusArea: string | null;
  progressPercent: number;
  totalTasks: number;
  doneTasks: number;
  completionRate: number;
  riskCount: number;
  avgRiskScore: number;
}

interface AnalyticsClientProps {
  totalProjects: number;
  totalTasks: number;
  totalRisks: number;
  taskStatusDistribution: { status: string; count: number; color: string }[];
  riskSeverity: { level: string; count: number; color: string }[];
  focusAreaDistribution: { area: string; count: number }[];
  weeklyVelocity: { week: string; completed: number; created: number }[];
  projectHealth: ProjectHealth[];
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planning', color: 'bg-blue-500/10 text-blue-600' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-600' },
  on_hold: { label: 'On Hold', color: 'bg-gray-500/10 text-gray-600' },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600' },
  archived: { label: 'Archived', color: 'bg-gray-500/10 text-gray-500' },
};

const FOCUS_COLORS: Record<string, string> = {
  initiating: 'oklch(0.65 0.18 270)',
  planning: 'oklch(0.72 0.18 155)',
  executing: 'oklch(0.78 0.16 80)',
  monitoring_controlling: 'oklch(0.68 0.18 290)',
  closing: 'oklch(0.55 0.02 270)',
};

export function AnalyticsClient({
  totalProjects,
  totalTasks,
  totalRisks,
  taskStatusDistribution,
  riskSeverity,
  focusAreaDistribution,
  weeklyVelocity,
  projectHealth,
}: AnalyticsClientProps) {
  const totalCompletion = totalTasks > 0
    ? Math.round((taskStatusDistribution.find((s) => s.status === 'Done')?.count ?? 0) / totalTasks * 100)
    : 0;
  const highRisks = riskSeverity.find((r) => r.level === 'High (10-16)')?.count ?? 0;
  const criticalRisks = riskSeverity.find((r) => r.level === 'Critical (17-25)')?.count ?? 0;

  return (
    <div className="flex flex-1 flex-col">
      {/* PAGE HEADER BAND */}
      <div className="border-b px-6 pt-8 pb-6 md:px-12 lg:px-16">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
            PORTFOLIO / ANALYTICS
          </p>
          <h1 className="text-[2.75rem] font-black font-heading tracking-[-0.025em] leading-[1.05] text-foreground">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Portfolio health, velocity trends, and risk overview
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-8 md:px-12 lg:px-16">
        <PMBOKGuide context="analytics" />

      {/* KPI Cards */}
      <StaggerContainer className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Projects</p>
                  <p className="text-2xl font-bold tabular-nums">
                    <NumberTicker value={totalProjects} />
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <FolderKanbanIcon className="size-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tasks Done</p>
                  <p className="text-2xl font-bold tabular-nums">
                    <NumberTicker value={taskStatusDistribution.find((s) => s.status === 'Done')?.count ?? 0} />
                    <span className="text-sm font-normal text-muted-foreground">/{totalTasks}</span>
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-2.5">
                  <ListTodoIcon className="size-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Active Risks</p>
                  <p className="text-2xl font-bold tabular-nums">
                    <NumberTicker value={totalRisks} />
                  </p>
                  {(highRisks + criticalRisks) > 0 && (
                    <span className="text-xs text-destructive">{highRisks + criticalRisks} high/critical</span>
                  )}
                </div>
                <div className="rounded-lg bg-amber-500/10 p-2.5">
                  <AlertTriangleIcon className="size-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold tabular-nums">
                    <NumberTicker value={totalCompletion} suffix="%" />
                  </p>
                </div>
                <div className="rounded-lg bg-sky-500/10 p-2.5">
                  <ActivityIcon className="size-5 text-sky-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Charts Row */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Task Status Distribution */}
        <StaggerItem>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Task Distribution</CardTitle>
              <CardDescription className="text-xs">Tasks by status across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              {totalTasks === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  No tasks yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={taskStatusDistribution.filter((s) => s.count > 0)}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {taskStatusDistribution.filter((s) => s.count > 0).map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-popover)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--color-popover-foreground)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {taskStatusDistribution.filter((s) => s.count > 0).map((entry) => (
                  <div key={entry.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.status} ({entry.count})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Risk Severity */}
        <StaggerItem>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk Severity</CardTitle>
              <CardDescription className="text-xs">Risk scores across portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              {totalRisks === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  No risks identified
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={riskSeverity.filter((r) => r.count > 0)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} width={24} />
                    <YAxis type="category" dataKey="level" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-popover)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        color: 'var(--color-popover-foreground)',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 3, 3, 0]} animationDuration={800}>
                      {riskSeverity.filter((r) => r.count > 0).map((entry) => (
                        <Cell key={entry.level} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Weekly Velocity */}
        <StaggerItem>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Weekly Velocity</CardTitle>
              <CardDescription className="text-xs">Tasks created vs completed (8 weeks)</CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyVelocityChart data={weeklyVelocity} />
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Focus Area Distribution + Portfolio Completion */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2">
        {/* Focus Area Bar Chart */}
        <StaggerItem>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Focus Area Distribution</CardTitle>
              <CardDescription className="text-xs">Projects by PMBOK process group</CardDescription>
            </CardHeader>
            <CardContent>
              {totalProjects === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  No projects yet
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {focusAreaDistribution.map((fa) => (
                    <div key={fa.area} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{fa.area}</span>
                        <span className="text-muted-foreground">{fa.count} project{fa.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${totalProjects > 0 ? (fa.count / totalProjects) * 100 : 0}%`,
                            backgroundColor: FOCUS_COLORS[fa.area.toLowerCase().replace(' ', '_')] ?? 'oklch(0.65 0.02 270)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Portfolio Completion */}
        <StaggerItem>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Completion</CardTitle>
              <CardDescription className="text-xs">Overall task completion rate</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <ProgressRing value={totalCompletion} size={140} label="complete" />
              <div className="grid grid-cols-2 gap-4 text-center w-full">
                <div>
                  <p className="text-2xl font-bold">{taskStatusDistribution.find((s) => s.status === 'Done')?.count ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalTasks - (taskStatusDistribution.find((s) => s.status === 'Done')?.count ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Project Health Table */}
      {projectHealth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Project Health</CardTitle>
            <CardDescription className="text-xs">Detailed view of each project's status and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Project</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Status</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Progress</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Tasks</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Completion</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Risks</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Avg Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {projectHealth.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGES[p.status]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_BADGES[p.status]?.label ?? p.status}
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${p.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{p.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="py-2 text-xs">{p.doneTasks}/{p.totalTasks}</td>
                      <td className="py-2 text-xs">{p.completionRate}%</td>
                      <td className="py-2 text-xs">{p.riskCount}</td>
                      <td className="py-2 text-xs">
                        {p.avgRiskScore > 0 ? (
                          <span className={
                            p.avgRiskScore >= 10 ? 'text-red-600 font-medium' :
                            p.avgRiskScore >= 5 ? 'text-amber-600' :
                            'text-emerald-600'
                          }>
                            {p.avgRiskScore}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}