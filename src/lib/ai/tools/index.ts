import { searchKnowledgeBaseTool } from './search-knowledge-base';
import { getProjectSummaryTool } from './get-project-summary';
import { listTasksTool } from './list-tasks';
import { listRisksTool } from './list-risks';
import { assessDomainHealthTool } from './assess-domain-health';
import { suggestRisksTool } from './suggest-risks';
import { identifyStakeholdersTool } from './identify-stakeholders';
import { createTaskTool } from './create-task';
import { createRiskTool } from './create-risk';
import { logLessonLearnedTool } from './log-lesson-learned';

// Read-only tools (no confirmation needed)
export const readOnlyTools = {
  searchKnowledgeBase: searchKnowledgeBaseTool,
  getProjectSummary: getProjectSummaryTool,
  listTasks: listTasksTool,
  listRisks: listRisksTool,
  assessDomainHealth: assessDomainHealthTool,
  suggestRisks: suggestRisksTool,
  identifyStakeholders: identifyStakeholdersTool,
};

// Write tools (require user confirmation)
export const writeTools = {
  createTask: createTaskTool,
  createRisk: createRiskTool,
  logLessonLearned: logLessonLearnedTool,
};

// All tools combined for the chat route
export const allTools = {
  ...readOnlyTools,
  ...writeTools,
};