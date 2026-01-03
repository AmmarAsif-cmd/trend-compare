/**
 * Context-Aware Next Actions
 * Determines the best 3 actions based on comparison signals and user state
 */

export interface NextAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  requiresAuth: boolean;
  priority: number; // Higher = more important
}

export interface NextActionsContext {
  isLoggedIn: boolean;
  isTracking: boolean;
  volatility: 'low' | 'medium' | 'high';
  confidence: number;
  gapChangePoints: number;
  disagreementFlag: boolean;
  agreementIndex: number;
  slug: string;
  termA: string;
  termB: string;
}

/**
 * Get the best 3 actions based on context
 */
export function getNextActions(context: NextActionsContext): NextAction[] {
  const actions: NextAction[] = [];

  // If not logged in, show retention actions
  if (!context.isLoggedIn) {
    actions.push({
      id: 'sign-in',
      title: 'Sign in to save and track',
      subtitle: 'Track changes and get alerts',
      icon: 'LogIn',
      href: `/login?callbackUrl=/compare/${context.slug}`,
      requiresAuth: false,
      priority: 100,
    });

    actions.push({
      id: 'create-alert',
      title: 'Create an alert (requires account)',
      subtitle: 'Get notified when trends change',
      icon: 'Bell',
      href: `/signup?callbackUrl=/compare/${context.slug}`,
      requiresAuth: false,
      priority: 90,
    });

    actions.push({
      id: 'download-pdf',
      title: 'Download PDF report',
      subtitle: 'Export this comparison for analysis',
      icon: 'Download',
      href: `/api/pdf/download?slug=${context.slug}`,
      requiresAuth: false,
      priority: 80,
    });

    return actions.slice(0, 3);
  }

  // Logged-in user actions - Always show 3 retention actions

  // 1) Track this comparison (or Manage tracking if already tracked)
  if (context.isTracking) {
    actions.push({
      id: 'manage-tracking',
      title: 'Manage tracking',
      subtitle: 'View history and adjust alerts',
      icon: 'Settings',
      href: `/dashboard?tab=tracked&slug=${context.slug}`,
      requiresAuth: true,
      priority: 100,
    });
  } else {
    actions.push({
      id: 'track-comparison',
      title: 'Track this comparison',
      subtitle: 'Save to your dashboard',
      icon: 'Bookmark',
      href: `/api/comparisons/save?slug=${context.slug}`,
      requiresAuth: true,
      priority: 100,
    });
  }

  // 2) Create an alert threshold
  actions.push({
    id: 'create-alert',
    title: 'Create an alert threshold',
    subtitle: 'Get notified when scores change',
    icon: 'Bell',
    href: `/dashboard/alerts/new?slug=${context.slug}&termA=${context.termA}&termB=${context.termB}`,
    requiresAuth: true,
    priority: 90,
  });

  // 3) Download PDF report
  actions.push({
    id: 'download-pdf',
    title: 'Download PDF report',
    subtitle: 'Export this comparison for analysis',
    icon: 'Download',
    href: `/api/pdf/download?slug=${context.slug}`,
    requiresAuth: true,
    priority: 80,
  });

  // Return exactly 3 actions
  return actions.slice(0, 3);
}

