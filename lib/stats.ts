import type { SeriesPoint } from "./trends";

export type Stats = {
  global_avg: Record<string, number>;
  peaks: { term: string; date: string; value: number }[];
};

export function computeStats(series: SeriesPoint[], terms: string[]): Stats {
  const avg = (t: string) => series.reduce((a, p) => a + Number(p[t] || 0), 0) / series.length;
  const global_avg = Object.fromEntries(terms.map(t => [t, Number(avg(t).toFixed(1))]));
  const peaks = terms.map(t => {
    let max = -1, date = "";
    series.forEach(p => {
      const v = Number(p[t]);
      if (v > max) { max = v; date = String(p.date); }
    });
    return { term: t, date, value: max };
  });
  return { global_avg, peaks };
}
