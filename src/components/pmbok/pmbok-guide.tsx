'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpenIcon, ChevronDownIcon, ZapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PMBOKContext =
  | 'dashboard'
  | 'portfolio'
  | 'portfolios'
  | 'program'
  | 'programs'
  | 'projects'
  | 'tasks'
  | 'analytics'
  | 'knowledge-base'
  | 'ai-chat'
  | 'project-detail';

interface GuideEntry {
  domain: string;
  domainColor: string;
  title: string;
  description: string;
  concepts: { term: string; definition: string }[];
  actions: string[];
  phaseGuide?: Record<string, { title: string; actions: string[] }>;
}

const GUIDE: Record<PMBOKContext, GuideEntry> = {
  dashboard: {
    domain: 'Enterprise',
    domainColor: 'bg-violet-500/15 text-violet-400',
    title: 'Enterprise Overview',
    description:
      'This is your enterprise-level view — above portfolios, programs, and individual projects. PMBOK 8 positions this as the organizational layer where strategic alignment is maintained across all portfolios, ensuring the right work is being done for the right reasons.',
    concepts: [
      {
        term: 'Portfolio vs. Enterprise',
        definition:
          'A Portfolio groups projects/programs by strategic theme. The enterprise view aggregates across all portfolios to give leadership a single health signal for the entire project ecosystem.',
      },
      {
        term: 'Value Delivery System',
        definition:
          "PMBOK 8's foundational model: organizations deliver value through a system of portfolios, programs, and projects. The enterprise dashboard surfaces how well that system is functioning holistically.",
      },
      {
        term: 'Strategic Alignment',
        definition:
          'Every active project should trace back to an organizational objective. Projects without a clear strategic link are candidates for re-scoping or cancellation.',
      },
    ],
    actions: [
      'Ensure every project belongs to a portfolio — unassigned projects lack strategic alignment',
      'Review portfolio health weekly; a portfolio with avg progress < 30% after mid-term needs governance intervention',
      'Balance project load across portfolios to avoid concentrating risk in one area',
      'Archive completed projects and transfer lessons learned to the knowledge base',
    ],
  },
  portfolio: {
    domain: 'Portfolio Governance',
    domainColor: 'bg-indigo-500/15 text-indigo-400',
    title: 'Portfolio Management — PMBOK 8',
    description:
      'A Portfolio is a collection of projects and programs grouped to achieve a strategic objective. PMBOK 8 Portfolio Management is not about running the projects — it is about selecting the right projects, allocating resources strategically, and governing value delivery at the collection level.',
    concepts: [
      {
        term: 'Portfolio Governance',
        definition:
          'The framework for making decisions about which projects to start, continue, accelerate, or stop based on strategic priority, risk exposure, and available capacity.',
      },
      {
        term: 'Benefits Realisation',
        definition:
          'Portfolio success is measured by whether the intended strategic benefits are actually realised, not just whether individual projects delivered their outputs on time and budget.',
      },
      {
        term: 'Resource Optimisation',
        definition:
          'Portfolios compete for the same pool of organisational resources. Effective portfolio management allocates resources to the projects delivering the highest strategic return.',
      },
    ],
    actions: [
      'Review avg progress across all projects; escalate any project below 50% at its halfway point',
      'Ensure each project in this portfolio has a documented charter with clear strategic objectives',
      'Monitor open risks across contained projects — aggregate risk exposure should inform portfolio decisions',
      'Conduct a quarterly portfolio review: continue, re-scope, or cancel projects based on value delivery',
    ],
  },
  portfolios: {
    domain: 'Portfolio Governance',
    domainColor: 'bg-indigo-500/15 text-indigo-400',
    title: 'Managing Multiple Portfolios',
    description:
      'Multiple portfolios allow you to separate projects by strategic theme, client, business unit, or company. Each portfolio operates as an independent governance unit with its own projects, resources, and success criteria — giving you clear accountability at every level.',
    concepts: [
      {
        term: 'Portfolio Segmentation',
        definition:
          'Dividing work into separate portfolios by strategic theme, client, or entity. Prevents cross-contamination of priorities and makes resource allocation and governance decisions cleaner.',
      },
      {
        term: 'Portfolio Prioritisation',
        definition:
          'When organisational capacity is limited, portfolios themselves must be prioritised. Some portfolios may be paused or reduced in scope to protect the most strategically important work.',
      },
    ],
    actions: [
      'Create one portfolio per distinct strategic theme, client, or business entity',
      'Assign every project to a portfolio before it enters execution; unassigned projects lack governance',
      'Compare portfolio health across entities to identify which areas need leadership attention',
      'Conduct a bi-annual portfolio rationalisation — remove or merge portfolios that no longer have active projects',
    ],
  },
  program: {
    domain: 'Program Management',
    domainColor: 'bg-sky-500/15 text-sky-400',
    title: 'Program Management — PMBOK 8',
    description:
      'A Program is a group of related projects managed in a coordinated way to obtain benefits not achievable from managing them individually. Programs exist between portfolios and projects, providing an intermediate coordination layer for complex, multi-project initiatives.',
    concepts: [
      {
        term: 'Program vs. Portfolio',
        definition:
          'A Portfolio groups projects by strategic theme. A Program groups related projects that share a common outcome, interdependencies, or resources — and must be coordinated to deliver their collective benefit.',
      },
      {
        term: 'Benefits Management',
        definition:
          "The Program Manager's primary responsibility. Benefits are the measurable improvements resulting from the program's outcomes — not simply the outputs of individual projects.",
      },
      {
        term: 'Program Governance',
        definition:
          'The framework for program decision-making, oversight, and control. Includes a Program Steering Committee, risk escalation paths, and change authority above individual project level.',
      },
    ],
    actions: [
      'Define the shared benefit this program delivers that no single project achieves alone',
      'Map interdependencies between contained projects — a delay in one may cascade to others',
      'Hold a monthly program review across all project managers to surface cross-project risks and blockers',
      'Track program-level milestones (not just project milestones) to measure collective progress toward the shared benefit',
    ],
  },
  programs: {
    domain: 'Program Management',
    domainColor: 'bg-sky-500/15 text-sky-400',
    title: 'Programs Across Your Portfolios',
    description:
      'Programs allow you to group related projects within a portfolio that share a common strategic outcome, resources, or timeline dependencies. Use programs when coordinating multiple projects toward a single shared goal is more effective than managing them independently.',
    concepts: [
      {
        term: 'When to Create a Program',
        definition:
          'Create a program when: projects share resources that need coordinating; project timelines are interdependent; or the collective benefit of the projects exceeds what each delivers individually.',
      },
      {
        term: 'Standalone Projects',
        definition:
          'Not every project needs a program. Short, independent projects with no shared resources or outputs should remain standalone under their portfolio.',
      },
    ],
    actions: [
      'Group related projects into a program only when they share outcomes, resources, or dependencies',
      'Assign a single Program Manager responsible for cross-project coordination',
      'Review program health monthly: aggregate progress, shared risks, and cross-project blockers',
      'Close a program formally once all contained projects are closed and benefits are confirmed delivered',
    ],
  },
  projects: {
    domain: 'Project Work',
    domainColor: 'bg-blue-500/15 text-blue-400',
    title: 'Managing Projects with PMBOK 8',
    description:
      'PMBOK 8 replaces Process Groups with Focus Areas that reflect your project\'s maturity. A project moves through Initiating → Planning → Executing → Monitoring & Controlling → Closing at its own pace, and you can iterate between areas as needed.',
    concepts: [
      {
        term: 'Focus Area',
        definition:
          'The current phase of your project. Unlike the old Process Groups, focus areas can overlap and repeat. A project in Executing still does continuous Monitoring & Controlling.',
      },
      {
        term: 'Project Charter',
        definition:
          "The document that formally authorizes a project and grants the PM authority to use resources. No charter = no project. Define objectives, scope, key stakeholders, and success criteria before executing any work.",
      },
      {
        term: 'Tailoring',
        definition:
          'PMBOK 8 requires adapting the methodology to each project\'s unique context, including team size, industry, risk profile, and organizational culture. There is no single "right" way.',
      },
    ],
    actions: [
      'Write a clear business case and measurable success criteria for each new project',
      'Set the focus area to reflect your actual current phase, not your planned phase',
      'Add all key stakeholders to the Stakeholders tab before starting execution',
      'Establish a budget baseline before tracking actuals; changes must go through change control',
    ],
    phaseGuide: {
      initiating: {
        title: 'Initiating Phase',
        actions: [
          'Document the business case: what problem does this project solve and for whom?',
          "Define high-level scope boundaries. What is OUT of scope is as important as what's in scope",
          'Identify your project sponsor and all key stakeholders before doing any work',
          'Establish measurable success criteria (specific, time-bound, and agreed by sponsor)',
          'Get formal authorization (signed charter or explicit sponsor approval) before proceeding to planning',
        ],
      },
      planning: {
        title: 'Planning Phase',
        actions: [
          'Create a Work Breakdown Structure (WBS): decompose all deliverables into work package tasks',
          'Estimate effort in hours for each task (not just duration) to expose true workload',
          'Identify all stakeholders and assess their power, interest, and engagement strategy',
          'Conduct risk identification: brainstorm at least 10 risks covering scope, schedule, cost, and quality',
          'Lock the schedule, scope, and budget baseline before execution; all changes require a change request',
        ],
      },
      executing: {
        title: 'Executing Phase',
        actions: [
          'Update task statuses daily. A Kanban board with stale data leads to bad decisions',
          'Track actual hours vs. estimates to identify effort variances early',
          "Manage stakeholder expectations proactively. Don't wait for issues to escalate",
          'Submit all scope changes through a formal change request before acting on them',
          'Conduct quality reviews against the acceptance criteria defined during planning',
        ],
      },
      monitoring_controlling: {
        title: 'Monitoring & Controlling Phase',
        actions: [
          'Calculate Schedule Performance Index (SPI) = completed tasks ÷ planned tasks for this period',
          'Review all open risks weekly; update probability and impact ratings as conditions change',
          'Process pending change requests: approve, reject, or defer with documented justification',
          'Compare actual costs vs. the budget baseline; escalate any variance exceeding 10%',
          'Prepare a concise status report covering progress, risks, issues, and forecast for stakeholders',
        ],
      },
      closing: {
        title: 'Closing Phase',
        actions: [
          'Obtain formal written acceptance from the project sponsor or customer for all deliverables',
          'Facilitate a lessons learned session; capture what worked, what failed, and recommendations',
          'Archive all project documents: charter, management plans, baselines, and change logs',
          'Formally release team members; recognize and celebrate their contributions',
          'Close out all vendor contracts and verify all invoices are settled before archiving',
        ],
      },
    },
  },
  tasks: {
    domain: 'Planning',
    domainColor: 'bg-amber-500/15 text-amber-400',
    title: 'Work Breakdown & Task Management',
    description:
      "Tasks represent work packages from your Work Breakdown Structure (WBS), PMBOK 8's primary scope management tool. Each task should be small enough to independently estimate, assign to one owner, and track to completion.",
    concepts: [
      {
        term: 'Work Package',
        definition:
          'The lowest level of the WBS. A work package can be scheduled, cost-estimated, monitored, and controlled. If you cannot estimate it, decompose it further.',
      },
      {
        term: 'WBS Code',
        definition:
          'A hierarchical identifier (e.g., 1.2.3) showing where a task sits in the project structure. Enables traceability from deliverable down to individual work package.',
      },
      {
        term: 'Effort vs. Duration',
        definition:
          'Effort = total person-hours required. Duration = calendar time elapsed. A 40-hour task with 2 people takes 40h effort but only 5 days duration. Always estimate effort, not just duration.',
      },
      {
        term: 'Critical Path',
        definition:
          'The longest chain of dependent tasks that determines the minimum project duration. Any delay on the critical path delays the entire project. Use predecessor links to identify it.',
      },
    ],
    actions: [
      'Use WBS codes (1.1, 1.2.1) to trace each task to a project deliverable',
      'Estimate effort hours for every task; a zero estimate means unplanned scope risk',
      'Assign each task to exactly one owner; shared ownership means no ownership',
      'Break tasks > 40 hours into smaller work packages for tighter tracking',
      'Link predecessor tasks to surface dependencies and reveal your critical path',
    ],
  },
  analytics: {
    domain: 'Measurement',
    domainColor: 'bg-emerald-500/15 text-emerald-400',
    title: 'Measurement Performance Domain',
    description:
      "PMBOK 8's Measurement Domain requires objective performance data to distinguish healthy projects from ones silently heading toward failure. These metrics go beyond task completion. They tell you whether projects will deliver their intended outcomes.",
    concepts: [
      {
        term: 'Schedule Performance Index (SPI)',
        definition:
          'Earned Value ÷ Planned Value. SPI < 1.0 = behind schedule. SPI > 1.0 = ahead. Target: ≥ 0.9. Below 0.85 requires a formal corrective action plan.',
      },
      {
        term: 'Cost Performance Index (CPI)',
        definition:
          'Earned Value ÷ Actual Cost. CPI < 1.0 = over budget. CPI > 1.0 = under budget. CPI < 0.8 is a critical warning requiring immediate escalation to the sponsor.',
      },
      {
        term: 'Velocity',
        definition:
          'Tasks completed per week. Rising velocity = improving team throughput. Declining velocity for 2+ weeks signals a blocker, dependency issue, or team morale problem.',
      },
      {
        term: 'Risk Exposure',
        definition:
          'Probability × Impact summed across all open risks. Rising aggregate exposure, even if individual risks are unchanged, requires review of your risk response plans.',
      },
    ],
    actions: [
      'Review velocity trends weekly; a 2-week consecutive decline demands investigation',
      'Flag any project with SPI < 0.85 for a formal corrective action plan within 48 hours',
      'Compare risk counts across projects to prioritize which projects need management attention',
      'Use focus area distribution to identify projects stuck in the same phase too long',
    ],
  },
  'knowledge-base': {
    domain: 'Delivery',
    domainColor: 'bg-purple-500/15 text-purple-400',
    title: 'Organizational Process Assets',
    description:
      "PMBOK 8 calls accumulated organizational knowledge 'Organizational Process Assets' (OPAs). Your knowledge base stores these assets, making them searchable and reusable across projects to reduce rework and improve quality over time.",
    concepts: [
      {
        term: 'Organizational Process Assets (OPAs)',
        definition:
          'Plans, processes, policies, procedures, and knowledge bases specific to the organization. OPAs enable analogous estimating, reduce planning time, and improve quality on future projects.',
      },
      {
        term: 'Lessons Learned Register',
        definition:
          "A formal record of knowledge gained during a project: what worked, what didn't, and recommendations. Required at project close. Stored here for use on future similar projects.",
      },
      {
        term: 'Historical Information',
        definition:
          'Data from past projects: schedules, cost actuals, risk logs, quality metrics. Essential for realistic estimating on new projects using analogous (top-down) estimating.',
      },
    ],
    actions: [
      'Upload your project charter and management plan as permanent reference documents',
      'Tag all documents by project for filtered search and future reference',
      'Store vendor contracts and SLAs for quick access during contract management',
      'Upload relevant industry standards (ISO, PMI, regulatory) that govern your projects',
      'Add lessons learned documents from every closed project to build organizational memory',
    ],
  },
  'ai-chat': {
    domain: 'Uncertainty',
    domainColor: 'bg-rose-500/15 text-rose-400',
    title: 'AI-Powered Project Intelligence',
    description:
      "Your AI assistant understands PMBOK 8 methodology and your project context. Use it to navigate the Uncertainty Performance Domain, identifying risks, developing response strategies, and making data-driven project decisions.",
    concepts: [
      {
        term: 'Uncertainty Performance Domain',
        definition:
          "One of PMBOK 8's 8 domains. Addresses risk, ambiguity, complexity, and volatility that affect project outcomes. Requires proactive identification, analysis, and response planning throughout the project lifecycle.",
      },
      {
        term: 'Risk Response Strategies',
        definition:
          'For threats: Avoid, Transfer, Mitigate, Accept. For opportunities: Exploit, Share, Enhance, Accept. Your AI can help develop specific, actionable response plans for each identified risk.',
      },
    ],
    actions: [
      'Ask: "What are the top 5 risks for a [type] project in the [phase] phase?"',
      'Ask: "Help me write a risk response plan for [specific risk description]"',
      'Ask: "Generate a stakeholder communication plan for [project name]"',
      'Ask: "What PMBOK 8 performance domains apply most to my current project challenges?"',
      'Ask: "Create a lessons learned template for project closure in [industry]"',
    ],
  },
  'project-detail': {
    domain: 'Project Work',
    domainColor: 'bg-blue-500/15 text-blue-400',
    title: 'Project Execution Guide',
    description:
      "Use the tabs to manage all aspects of this project aligned to PMBOK 8's Performance Domains. Tasks = WBS, Notes = communication records, Stakeholders = engagement register, Risks = risk register, Changes = change log.",
    concepts: [
      {
        term: 'Integrated Change Control',
        definition:
          'All scope, schedule, or budget changes must be formally requested, analyzed for impact, and approved before execution. Never modify the baseline informally.',
      },
      {
        term: 'Issue vs. Risk',
        definition:
          'A risk is uncertain; it might happen. An issue has already occurred and requires immediate resolution. Track both separately. An unmanaged risk becomes an issue.',
      },
    ],
    actions: [
      "Keep task statuses current; a stale board is the #1 source of poor project decisions",
      'Submit all scope changes as change requests before executing them',
      'Update stakeholder engagement levels after each key milestone or deliverable',
      'Review and re-score open risks weekly during executing and monitoring phases',
    ],
  },
};

interface PMBOKGuideProps {
  context: PMBOKContext;
  focusArea?: string | null;
  className?: string;
}

export function PMBOKGuide({ context, focusArea, className }: PMBOKGuideProps) {
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const guide = GUIDE[context];
  const phaseGuide =
    guide.phaseGuide && focusArea ? guide.phaseGuide[focusArea] ?? null : null;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden',
        className
      )}
    >
      {/* Trigger bar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Left border accent */}
        <motion.span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-primary"
          animate={{ opacity: hovered ? 1 : 0, scaleY: hovered ? 1 : 0.4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{ originY: 0.5 }}
        />

        <div className="flex items-center gap-2.5 min-w-0">
          <BookOpenIcon className="size-3.5 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest whitespace-nowrap">
            PMBOK 8 Guide
          </span>
          <span
            className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
              guide.domainColor
            )}
          >
            {guide.domain}
          </span>
          {phaseGuide && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
              {phaseGuide.title}
            </span>
          )}
        </div>
        <motion.div
          className="flex items-center gap-1.5 ml-2 shrink-0"
          animate={{ x: hovered ? 2 : 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <span className="text-[11px] text-muted-foreground/50 hidden sm:block">
            {open ? 'Hide guide' : 'Show guide'}
          </span>
          <motion.span
            initial={{ y: 0 }}
            animate={{ y: [0, 4, 0, 3, 0] }}
            transition={{ duration: 0.9, ease: 'easeInOut', delay: 0.8 }}
            className="inline-flex items-center"
          >
            <ChevronDownIcon
              className={cn(
                'size-3.5 text-muted-foreground/50 transition-colors duration-200',
                open && 'rotate-180'
              )}
            />
          </motion.span>
        </motion.div>
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30 px-4 pt-4 pb-5 grid gap-5 md:grid-cols-2">
              {/* Left: Description + Key Concepts */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {guide.description}
                </p>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
                    Key Concepts
                  </p>
                  <div className="space-y-2.5">
                    {guide.concepts.map((c) => (
                      <div key={c.term} className="text-xs leading-relaxed">
                        <span className="font-semibold text-foreground/90">{c.term}:&nbsp;</span>
                        <span className="text-muted-foreground">{c.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <ZapIcon className="size-3 text-primary/70" />
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {phaseGuide ? `${phaseGuide.title}: Action Items` : 'Recommended Actions'}
                  </p>
                </div>
                <ul className="space-y-2">
                  {(phaseGuide?.actions ?? guide.actions).map((action, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                      <span className="mt-0.5 size-4 shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center tabular-nums">
                        {i + 1}
                      </span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
