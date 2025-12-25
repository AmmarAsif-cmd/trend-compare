/**
 * Database Schema for Honest Metrics System
 * Tracks traffic, accuracy, and time saved - NO revenue/income claims
 */

-- ============================================================================
-- PREDICTION RECORDS (Track accuracy over time)
-- ============================================================================

CREATE TABLE prediction_records (
  id VARCHAR(255) PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,

  -- What we predicted
  predicted_date DATE NOT NULL,
  predicted_date_range_start DATE NOT NULL,
  predicted_date_range_end DATE NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('annual', 'quarterly', 'monthly', 'weekly', 'event-driven')),

  -- What actually happened
  actual_peak_date DATE NULL,
  peak_value INTEGER NULL CHECK (peak_value >= 0 AND peak_value <= 100),

  -- Accuracy assessment
  accuracy VARCHAR(50) CHECK (accuracy IN ('exact', 'within-3-days', 'within-week', 'within-month', 'missed', 'pending')),
  days_difference INTEGER NULL,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP NULL,

  INDEX idx_keyword (keyword),
  INDEX idx_predicted_date (predicted_date),
  INDEX idx_accuracy (accuracy),
  INDEX idx_pattern_type (pattern_type)
);

-- ============================================================================
-- ARTICLE PERFORMANCE (Track traffic impact)
-- ============================================================================

CREATE TABLE article_performance (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,

  -- Article details
  title VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  publish_date DATE NOT NULL,
  keyword VARCHAR(255) NOT NULL,

  -- Prediction tracking
  based_on_prediction BOOLEAN DEFAULT FALSE,
  predicted_date DATE NULL,
  actual_peak_date DATE NULL,
  timing_accuracy VARCHAR(50) CHECK (timing_accuracy IN ('exact', 'within-3-days', 'within-week', 'within-month', 'missed', 'no-prediction')),

  -- Traffic metrics (honest, measurable)
  traffic_day1 INTEGER DEFAULT 0,
  traffic_week1 INTEGER DEFAULT 0,
  traffic_month1 INTEGER DEFAULT 0,
  traffic_total INTEGER DEFAULT 0,

  -- Comparison to user's average
  vs_average_multiplier DECIMAL(5,2) NULL,  -- e.g., 6.5
  vs_average_difference INTEGER NULL,       -- e.g., +15247

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_publish_date (publish_date),
  INDEX idx_keyword (keyword),
  INDEX idx_based_on_prediction (based_on_prediction),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- USER ANALYTICS CACHE (Pre-computed metrics for fast display)
-- ============================================================================

CREATE TABLE user_analytics_cache (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  period VARCHAR(50) NOT NULL DEFAULT 'this-month',

  -- Prediction usage
  predictions_used INTEGER DEFAULT 0,
  predictions_available INTEGER DEFAULT 0,
  utilization_rate INTEGER DEFAULT 0,  -- percentage

  -- Traffic metrics (NO REVENUE)
  total_visitors INTEGER DEFAULT 0,
  predicted_articles INTEGER DEFAULT 0,
  non_predicted_articles INTEGER DEFAULT 0,
  avg_traffic_predicted INTEGER DEFAULT 0,
  avg_traffic_non_predicted INTEGER DEFAULT 0,
  impact_multiplier DECIMAL(5,2) DEFAULT 0,  -- e.g., 6.5x

  -- Time saved (estimated)
  time_saved_research_hours INTEGER DEFAULT 0,
  time_saved_monitoring_hours INTEGER DEFAULT 0,
  time_saved_analysis_hours INTEGER DEFAULT 0,
  time_saved_total_hours INTEGER DEFAULT 0,

  -- Opportunities
  opportunities_identified INTEGER DEFAULT 0,
  opportunities_acted_on INTEGER DEFAULT 0,
  opportunities_missed INTEGER DEFAULT 0,
  missed_traffic_estimate INTEGER DEFAULT 0,

  -- Performance vs baseline
  current_period_traffic INTEGER DEFAULT 0,
  previous_period_traffic INTEGER DEFAULT 0,
  growth_percentage INTEGER DEFAULT 0,
  trend VARCHAR(50) CHECK (trend IN ('growing', 'stable', 'declining')),

  -- Cache metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 day'),

  INDEX idx_user_id (user_id),
  INDEX idx_period (period),
  INDEX idx_expires_at (expires_at),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- USER PREFERENCES (How they want to see their data)
-- ============================================================================

CREATE TABLE user_preferences (
  user_id VARCHAR(255) PRIMARY KEY,

  -- Analytics integration
  google_analytics_connected BOOLEAN DEFAULT FALSE,
  google_analytics_view_id VARCHAR(255) NULL,

  -- Alert preferences
  email_alerts_enabled BOOLEAN DEFAULT TRUE,
  slack_webhook_url VARCHAR(500) NULL,
  alert_frequency VARCHAR(50) DEFAULT 'daily' CHECK (alert_frequency IN ('realtime', 'daily', 'weekly')),

  -- Display preferences
  show_traffic_metrics BOOLEAN DEFAULT TRUE,
  show_accuracy_stats BOOLEAN DEFAULT TRUE,
  show_time_saved BOOLEAN DEFAULT TRUE,
  show_missed_opportunities BOOLEAN DEFAULT TRUE,

  -- NO revenue tracking options (we don't track money)

  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- OPPORTUNITIES LOG (Track what we recommended vs what user did)
-- ============================================================================

CREATE TABLE opportunities_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,

  -- Opportunity details
  keyword VARCHAR(255) NOT NULL,
  predicted_date DATE NOT NULL,
  confidence INTEGER NOT NULL,
  estimated_traffic_min INTEGER NOT NULL,
  estimated_traffic_max INTEGER NOT NULL,

  -- User action
  acted_on BOOLEAN DEFAULT FALSE,
  article_id VARCHAR(255) NULL,  -- FK to article_performance if published
  action_date DATE NULL,

  -- Outcome (if acted on)
  actual_traffic INTEGER NULL,
  vs_estimate VARCHAR(50) NULL,  -- 'exceeded', 'met', 'below'

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_keyword (keyword),
  INDEX idx_predicted_date (predicted_date),
  INDEX idx_acted_on (acted_on),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES article_performance(id) ON DELETE SET NULL
);

-- ============================================================================
-- ANALYTICS EVENTS (Track key user actions)
-- ============================================================================

CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,

  -- Event details
  metadata JSONB,  -- flexible JSON for different event types

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Example events:
-- event_type: 'prediction_viewed', metadata: { keyword, predicted_date, confidence }
-- event_type: 'alert_sent', metadata: { keyword, alert_type, sent_at }
-- event_type: 'article_published', metadata: { keyword, traffic, based_on_prediction }
-- event_type: 'opportunity_missed', metadata: { keyword, estimated_traffic_lost }

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- User's current month performance
CREATE VIEW user_monthly_performance AS
SELECT
  user_id,
  COUNT(*) as total_articles,
  SUM(CASE WHEN based_on_prediction THEN 1 ELSE 0 END) as predicted_articles,
  SUM(traffic_total) as total_traffic,
  AVG(CASE WHEN based_on_prediction THEN traffic_total ELSE NULL END) as avg_traffic_predicted,
  AVG(CASE WHEN NOT based_on_prediction THEN traffic_total ELSE NULL END) as avg_traffic_normal,
  DATE_TRUNC('month', publish_date) as month
FROM article_performance
WHERE publish_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY user_id, DATE_TRUNC('month', publish_date);

-- Prediction accuracy summary
CREATE VIEW prediction_accuracy_summary AS
SELECT
  COUNT(*) as total_predictions,
  SUM(CASE WHEN accuracy = 'exact' THEN 1 ELSE 0 END) as exact,
  SUM(CASE WHEN accuracy = 'within-3-days' THEN 1 ELSE 0 END) as within_3_days,
  SUM(CASE WHEN accuracy = 'within-week' THEN 1 ELSE 0 END) as within_week,
  SUM(CASE WHEN accuracy = 'within-month' THEN 1 ELSE 0 END) as within_month,
  SUM(CASE WHEN accuracy = 'missed' THEN 1 ELSE 0 END) as missed,
  SUM(CASE WHEN accuracy = 'pending' THEN 1 ELSE 0 END) as pending,
  ROUND(
    (SUM(CASE WHEN accuracy IN ('exact', 'within-3-days', 'within-week') THEN 1 ELSE 0 END)::decimal /
     NULLIF(SUM(CASE WHEN accuracy != 'pending' THEN 1 ELSE 0 END), 0)) * 100,
    2
  ) as accuracy_rate
FROM prediction_records;

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get user's impact this month
-- SELECT * FROM user_analytics_cache WHERE user_id = 'user123' AND period = 'this-month';

-- Get prediction accuracy
-- SELECT * FROM prediction_accuracy_summary;

-- Get missed opportunities for a user
-- SELECT * FROM opportunities_log WHERE user_id = 'user123' AND acted_on = FALSE;

-- Get user's best performing articles
-- SELECT title, traffic_total, vs_average_multiplier
-- FROM article_performance
-- WHERE user_id = 'user123'
-- ORDER BY traffic_total DESC
-- LIMIT 10;

-- ============================================================================
-- NOTES
-- ============================================================================

/**
 * IMPORTANT: This schema tracks HONEST, MEASURABLE metrics only:
 *
 * ✓ Traffic (pageviews, visitors) - verifiable via Google Analytics
 * ✓ Prediction accuracy (dates) - verifiable facts
 * ✓ Time saved (estimated but reasonable) - based on industry averages
 * ✓ Opportunities (what we recommended) - factual record
 *
 * ✗ NO revenue tracking - we don't know user's monetization
 * ✗ NO income claims - legally risky and dishonest
 * ✗ NO ROI in dollars - too many variables
 *
 * This builds trust through honesty, not false promises.
 */
