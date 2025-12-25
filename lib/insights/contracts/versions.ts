/**
 * Version constants for the Insight Framework
 * Used for cache invalidation and schema evolution
 */

export const INSIGHT_VERSION = "1";
export const PROMPT_VERSION = "1";
export const PREDICTION_ENGINE_VERSION = "1";

/**
 * Combined version string for cache keys
 */
export const INSIGHT_FRAMEWORK_VERSION = `${INSIGHT_VERSION}.${PROMPT_VERSION}.${PREDICTION_ENGINE_VERSION}`;

