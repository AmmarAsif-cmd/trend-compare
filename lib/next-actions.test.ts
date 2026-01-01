/**
 * Unit tests for getNextActions
 */

import { describe, it, expect } from 'vitest';
import { getNextActions, type NextActionsContext } from './next-actions';

describe('getNextActions', () => {
  const baseContext: NextActionsContext = {
    isLoggedIn: true,
    isTracking: false,
    volatility: 'medium',
    confidence: 75,
    gapChangePoints: 0,
    disagreementFlag: false,
    agreementIndex: 80,
    slug: 'react-vs-vue',
    termA: 'react',
    termB: 'vue',
  };

  it('should always return exactly 3 actions', () => {
    const actions = getNextActions(baseContext);
    expect(actions.length).toBe(3);
  });

  it('should prioritize sign-in for logged-out users', () => {
    const context = { ...baseContext, isLoggedIn: false };
    const actions = getNextActions(context);
    expect(actions[0].id).toBe('sign-in');
    expect(actions[0].requiresAuth).toBe(false);
  });

  it('should suggest alert for high volatility', () => {
    const context = { ...baseContext, volatility: 'high' as const };
    const actions = getNextActions(context);
    const alertAction = actions.find(a => a.id === 'alert-sudden-changes');
    expect(alertAction).toBeDefined();
    expect(alertAction?.subtitle).toContain('volatility');
  });

  it('should suggest alert for disagreement', () => {
    const context = { ...baseContext, disagreementFlag: true };
    const actions = getNextActions(context);
    const alertAction = actions.find(a => a.id === 'alert-sudden-changes');
    expect(alertAction).toBeDefined();
  });

  it('should suggest tracking when gap is narrowing', () => {
    const context = { ...baseContext, gapChangePoints: -3 };
    const actions = getNextActions(context);
    const trackAction = actions.find(a => a.id === 'track-weekly');
    expect(trackAction).toBeDefined();
    expect(trackAction?.subtitle).toContain('narrowing');
  });

  it('should suggest PDF download for high confidence', () => {
    const context = { ...baseContext, confidence: 85 };
    const actions = getNextActions(context);
    const pdfAction = actions.find(a => a.id === 'download-pdf');
    expect(pdfAction).toBeDefined();
    expect(pdfAction?.subtitle).toContain('confidence');
  });

  it('should show manage tracking if already tracking', () => {
    const context = { ...baseContext, isTracking: true };
    const actions = getNextActions(context);
    const manageAction = actions.find(a => a.id === 'manage-tracking');
    expect(manageAction).toBeDefined();
    expect(manageAction?.title).toContain('Manage');
  });

  it('should show track comparison if not tracking', () => {
    const context = { ...baseContext, isTracking: false };
    const actions = getNextActions(context);
    const trackAction = actions.find(a => a.id === 'track-comparison');
    expect(trackAction).toBeDefined();
  });

  it('should always return exactly 3 retention actions for logged-in users', () => {
    const actions = getNextActions(baseContext);
    expect(actions.length).toBe(3);
    expect(actions[0].id).toBe('track-comparison');
    expect(actions[1].id).toBe('create-alert');
    expect(actions[2].id).toBe('download-pdf');
  });

  it('should always return exactly 3 retention actions for logged-out users', () => {
    const context = { ...baseContext, isLoggedIn: false };
    const actions = getNextActions(context);
    expect(actions.length).toBe(3);
    expect(actions[0].id).toBe('sign-in');
    expect(actions[1].id).toBe('create-alert');
    expect(actions[2].id).toBe('download-pdf');
  });

  it('should sort by priority (highest first)', () => {
    const context = { ...baseContext, volatility: 'high' as const, confidence: 90, gapChangePoints: -5 };
    const actions = getNextActions(context);
    expect(actions[0].priority).toBeGreaterThanOrEqual(actions[1].priority);
    expect(actions[1].priority).toBeGreaterThanOrEqual(actions[2].priority);
  });
});

