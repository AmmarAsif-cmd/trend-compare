import type { Stats } from "./stats";

export type AICopy = {
  title: string;
  metaDescription: string;
  summary: string;
  verdict: string;
  insights: string[];
  faq: { q: string; a: string }[];
};

export function generateCopy(terms: string[], stats: Stats): AICopy {
  const leader = Object.entries(stats.global_avg).sort((a,b)=>b[1]-a[1])[0][0];
  return {
    title: `${terms.join(" vs ")} — Popularity Snapshot`,
    metaDescription: `Compare ${terms.join(" and ")} search interest over the past year with a simple trend chart.`,
    summary: `Over the last year, ${leader} shows higher average interest across the selected terms.`,
    verdict: `${leader} leads based on average normalized search interest.`,
    insights: stats.peaks.slice(0,3).map(p => `${p.term} peaked on ${p.date} at ${p.value}.`),
    faq: [
      { q: "What is this data?", a: "It summarizes relative search interest over time." },
      { q: "How often is this updated?", a: "Pages refresh on a schedule to keep content current." }
    ]
  };
}
