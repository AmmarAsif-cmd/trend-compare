/**
 * System AI Context
 * 
 * Provides a system context for background jobs to make AI calls
 * without budget restrictions (jobs have their own limits)
 */

/**
 * Create a system AI context that bypasses user budget checks
 * but still respects global limits and caching
 */
export function createSystemAIContext() {
  return {
    userId: 'system',
    bypassBudget: true, // Background jobs don't count against user budgets
  };
}

