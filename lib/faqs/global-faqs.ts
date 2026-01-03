/**
 * Global FAQs
 * Static FAQs that appear on every comparison page
 * These explain TrendArc in general, not specific comparisons
 */

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export const GLOBAL_FAQS: FAQ[] = [
  {
    id: 'how-score-calculated',
    question: 'How does TrendArc calculate the score?',
    answer: 'TrendArc combines multiple signals: search interest (Google Trends), social buzz (YouTube, Spotify, Wikipedia), authority (category-specific sources like TMDB, Steam, Best Buy), and momentum (trend direction). Each signal is weighted and normalized to produce a 0-100 score that reflects overall popularity.',
  },
  {
    id: 'what-confidence-means',
    question: 'What does Confidence mean?',
    answer: 'Confidence (0-100%) reflects how reliable the comparison is. High confidence means consistent data across sources and stable trends. Lower confidence may indicate volatile data, source disagreement, or limited historical data.',
  },
  {
    id: 'stable-vs-hype',
    question: 'What does Stable vs Hype mean?',
    answer: 'Stable trends show consistent popularity over time with low volatility. Hype trends have sudden spikes, high volatility, or rapid rises followed by falls. Volatile trends fluctuate significantly. This classification helps you understand whether a trend is sustainable or temporary.',
  },
  {
    id: 'data-update-frequency',
    question: 'How often is data updated?',
    answer: 'Data refreshes every 4 hours. Popular comparisons update hourly to ensure you always have the latest insights. Historical data is preserved so you can track changes over time.',
  },
  {
    id: 'source-disagreement',
    question: 'Why do different sources disagree sometimes?',
    answer: 'Different platforms measure different aspects of popularity. Google Trends shows search interest, while YouTube shows engagement, and category-specific sources (like TMDB) show domain authority. Disagreement is normal and helps reveal nuanced trends. We show an Agreement Index to highlight when sources align.',
  },
  {
    id: 'export-report',
    question: 'Can I export this report?',
    answer: 'Yes! You can download a PDF analyst brief or export data as CSV. The PDF includes an executive summary, evidence breakdown, charts, and metadata. CSV exports include time series data, derived metrics, and structured insights for analysis.',
  },
];

