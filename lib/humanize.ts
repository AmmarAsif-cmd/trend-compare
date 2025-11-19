// lib/humanize.ts
import type { SeriesPoint } from "@/lib/trends";

/* ---------------- basic helpers ---------------- */

const monthName = (d: Date) =>
  d.toLocaleString("en-GB", { month: "long", year: "numeric" });

const dayName = (d: Date) =>
  d.toLocaleString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function toDateISO(s: string | number): string {
  const d = typeof s === "number" ? new Date(s * 1000) : new Date(String(s));
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function avg(xs: number[]) {
  return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;
}

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

function stdev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = sum(xs) / xs.length;
  const v = sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1);
  return Math.sqrt(v);
}

function slope(xs: number[]) {
  const n = xs.length;
  if (n < 2) return 0;
  const xbar = (n - 1) / 2;
  const ybar = sum(xs) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xbar) * (xs[i] - ybar);
    den += (i - xbar) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function pctChange(from: number, to: number) {
  if (!from && !to) return 0;
  if (!from) return 100;
  return Math.round(((to - from) / Math.abs(from)) * 100);
}

function trendWord(m: number) {
  if (m > 0.6) return "rising fast";
  if (m > 0.2) return "rising";
  if (m < -0.6) return "falling fast";
  if (m < -0.2) return "falling";
  return "steady";
}

function volatilityWord(std: number) {
  if (std >= 20) return "very choppy";
  if (std >= 10) return "choppy";
  return "steady";
}

function looksBroad(term: string) {
  const t = term.toLowerCase().trim();
  return (
    (t.length <= 4 && /^[a-z]+$/.test(t)) ||
    (!/\s/.test(t) && /^[a-z]+$/.test(t) && t.length <= 6)
  );
}

function timeframeLabel(code?: string) {
  switch (code) {
    case "7d":
      return "over the last 7 days";
    case "30d":
    case "1m":
      return "over the last 30 days";
    case "3m":
      return "over the last 3 months";
    case "12m":
      return "over the past 12 months";
    case "5y":
      return "over the past 5 years";
    case "all":
      return "across the full available history";
    default:
      return "over this period";
  }
}

/* ---------------- point wise helpers ---------------- */

function peakFor(term: string, series: SeriesPoint[]) {
  let best = { term, date: "", value: 0 };
  for (const row of series) {
    const v = Number(row[term] ?? 0);
    if (v > best.value) {
      best.value = v;
      best.date = toDateISO(String(row.date ?? ""));
    }
  }
  return best;
}

function recentWindow(xs: number[], n: number) {
  return xs.slice(-Math.max(3, Math.min(n, xs.length)));
}

function firstWindow(xs: number[], n: number) {
  return xs.slice(0, Math.max(3, Math.min(n, xs.length)));
}

function shareOfLeading(aVals: number[], bVals: number[]) {
  let a = 0;
  let b = 0;
  for (let i = 0; i < Math.min(aVals.length, bVals.length); i++) {
    if (aVals[i] > bVals[i]) a++;
    else if (bVals[i] > aVals[i]) b++;
  }
  const total = a + b || 1;
  return {
    aPct: Math.round((a / total) * 100),
    bPct: Math.round((b / total) * 100),
    total,
  };
}

function crossovers(aVals: number[], bVals: number[], dates: string[]) {
  let count = 0;
  let last = "";
  for (let i = 1; i < Math.min(aVals.length, bVals.length); i++) {
    const prev = aVals[i - 1] - bVals[i - 1];
    const curr = aVals[i] - bVals[i];
    if ((prev <= 0 && curr > 0) || (prev >= 0 && curr < 0)) {
      count++;
      last = dates[i] || "";
    }
  }
  return { count, last };
}

function monthlyAverages(term: string, series: SeriesPoint[]) {
  const map = new Map<string, number[]>();
  for (const r of series) {
    const v = Number(r[term] ?? 0);
    const d = new Date(String(r.date ?? ""));
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const arr = map.get(key) ?? [];
    arr.push(v);
    map.set(key, arr);
  }
  const rows = Array.from(map.entries())
    .map(([k, arr]) => ({ ym: k, avg: Math.round(sum(arr) / arr.length) }))
    .sort((a, b) => (a.ym < b.ym ? -1 : 1));
  if (!rows.length) return null;
  const best = rows.reduce((p, c) => (c.avg > p.avg ? c : p), rows[0]);
  const [y, m] = best.ym.split("-");
  return `${monthName(new Date(Number(y), Number(m) - 1, 1))}`;
}

/* ---------------- public types ---------------- */

export type HumanCopy = {
  summary: string;
  extraBullets: string[];
  atAGlance: string[];
  table: { rows: Array<{ label: string; a: string; b: string }> };
  scaleExplainer: string;
  infoNote: string | null;
  suggestions: string[];
  longForm: string[];
};

/* ---------------- main builder ---------------- */

export function buildHumanCopy(
  terms: string[],
  series: SeriesPoint[],
  opts?: { timeframe?: string }
): HumanCopy {
  const [A, B] = terms;
  const dates = series.map((r) => String(r.date ?? ""));

  const aVals = series.map((r) => Number(r[A] ?? 0));
  const bVals = series.map((r) => Number(r[B] ?? 0));

  const aAvg = avg(aVals);
  const bAvg = avg(bVals);

  const topAvg = Math.max(aAvg, bAvg) || 1;
  const gapPct = Math.round((Math.abs(aAvg - bAvg) / topAvg) * 100);
  const leader = aAvg >= bAvg ? A : B;
  const trailer = aAvg >= bAvg ? B : A;

  const tfLabel = timeframeLabel(opts?.timeframe);

  let summary: string;
  if (aAvg === bAvg) {
    summary = `${A} and ${B} sit very close to each other ${tfLabel}. On average there is almost no gap between them.`;
  } else if (gapPct < 15) {
    summary = `${leader} has a slight edge over ${trailer} ${tfLabel}, with only a small average gap of around ${gapPct} percent.`;
  } else if (gapPct < 40) {
    summary = `${leader} is clearly ahead of ${trailer} ${tfLabel}, with an average lead of roughly ${gapPct} percent.`;
  } else {
    summary = `${leader} dominates searches compared with ${trailer} ${tfLabel}, with an average lead of about ${gapPct} percent.`;
  }

  /* ------------ core stats ------------ */

  const aPeak = peakFor(A, series);
  const bPeak = peakFor(B, series);

  const aSlope = slope(aVals);
  const bSlope = slope(bVals);

  const aTrend = trendWord(aSlope);
  const bTrend = trendWord(bSlope);

  const aStd = Math.round(stdev(aVals));
  const bStd = Math.round(stdev(bVals));

  const aVol = volatilityWord(aStd);
  const bVol = volatilityWord(bStd);

  const leadShare = shareOfLeading(aVals, bVals);
  const xo = crossovers(aVals, bVals, dates);

  const aMonth = monthlyAverages(A, series);
  const bMonth = monthlyAverages(B, series);

  /* ------------ at a glance text ------------ */

  const atAGlance: string[] = [];

  atAGlance.push(
    `Average interest: ${A} ${aAvg}, ${B} ${bAvg}. ${leader} comes out ahead on most weeks.`
  );

  if (aPeak.value || bPeak.value) {
    const aPeakText = aPeak.value
      ? `${A} peaked in ${monthName(new Date(aPeak.date))} at ${aPeak.value}.`
      : `${A} never really spikes on this chart.`;
    const bPeakText = bPeak.value
      ? `${B} peaked in ${monthName(new Date(bPeak.date))} at ${bPeak.value}.`
      : `${B} never really spikes on this chart.`;
    atAGlance.push(`${aPeakText} ${bPeakText}`);
  }

  atAGlance.push(
    `Recent trend: ${A} looks ${aTrend}, while ${B} looks ${bTrend}.`
  );
  atAGlance.push(
    `Stability: ${A} is ${aVol}, and ${B} is ${bVol}. Higher volatility usually means more short lived spikes.`
  );

  atAGlance.push(
    `Head to head: ${A} leads in about ${leadShare.aPct} percent of points, while ${B} leads in about ${leadShare.bPct} percent.`
  );

  if (xo.count > 0) {
    atAGlance.push(
      `The lines cross ${xo.count} time${xo.count === 1 ? "" : "s"}, with the latest crossover on ${
        xo.last ? dayName(new Date(xo.last)) : "a recent date"
      }.`
    );
  } else {
    atAGlance.push(
      `There is no clear crossover in this view. One term keeps the lead from start to finish.`
    );
  }

  /* ------------ table friendly stats ------------ */

  const table = {
    rows: [
      { label: "Average interest", a: String(aAvg), b: String(bAvg) },
      { label: "Recent direction", a: aTrend, b: bTrend },
      { label: "Stability", a: aVol, b: bVol },
      {
        label: "Peak month",
        a: aPeak.value ? monthName(new Date(aPeak.date)) : "none",
        b: bPeak.value ? monthName(new Date(bPeak.date)) : "none",
      },
      {
        label: "Best month by average",
        a: aMonth ?? "not clear",
        b: bMonth ?? "not clear",
      },
      {
        label: "Share of leading points",
        a: `${leadShare.aPct}%`,
        b: `${leadShare.bPct}%`,
      },
      {
        label: "Lead changes",
        a: xo.count ? String(xo.count) : "0",
        b: xo.last ? dayName(new Date(xo.last)) : "not recent",
      },
    ],
  };

  /* ------------ extra bullets for Summary card ------------ */

  const extraBullets: string[] = [];

  const firstA = avg(firstWindow(aVals, Math.floor(aVals.length / 3)));
  const lastA = avg(recentWindow(aVals, Math.floor(aVals.length / 3)));
  const firstB = avg(firstWindow(bVals, Math.floor(bVals.length / 3)));
  const lastB = avg(recentWindow(bVals, Math.floor(bVals.length / 3)));

  const growA = pctChange(firstA, lastA);
  const growB = pctChange(firstB, lastB);

  if (growA === 0) {
    extraBullets.push(`${A} stays roughly flat from the start to the end.`);
  } else if (growA > 0) {
    extraBullets.push(
      `${A} has climbed by about ${growA} percent from the early part of the chart to the most recent section.`
    );
  } else {
    extraBullets.push(
      `${A} has eased off by around ${Math.abs(
        growA
      )} percent between the early and late parts of the chart.`
    );
  }

  if (growB === 0) {
    extraBullets.push(`${B} also stays fairly level across the period.`);
  } else if (growB > 0) {
    extraBullets.push(
      `${B} has grown by roughly ${growB} percent from early to late in the chart.`
    );
  } else {
    extraBullets.push(
      `${B} has dropped by roughly ${Math.abs(
        growB
      )} percent between the start and the end of the period.`
    );
  }

  /* ------------ long form narrative (Deep dive) ------------ */

  const longForm: string[] = [];

  longForm.push(
    `This chart shows how often people searched for ${A} and ${B} ${tfLabel}. Values go from zero to one hundred for each term, where one hundred is that term’s own highest point in the selected period.`
  );

  const third = Math.max(3, Math.floor(series.length / 3));
  const early = { a: avg(aVals.slice(0, third)), b: avg(bVals.slice(0, third)) };
  const mid = {
    a: avg(aVals.slice(third, 2 * third)),
    b: avg(bVals.slice(third, 2 * third)),
  };
  const late = {
    a: avg(aVals.slice(2 * third)),
    b: avg(bVals.slice(2 * third)),
  };

  longForm.push(
    `If you split the period into three chunks, the early averages look like this: ${A} ${early.a} and ${B} ${early.b}. In the middle section they move to ${A} ${mid.a} and ${B} ${mid.b}. By the most recent third they sit around ${A} ${late.a} and ${B} ${late.b}.`
  );

  if (aPeak.value || bPeak.value) {
    longForm.push(
      `${A} hits its sharpest peak in ${
        aPeak.value ? monthName(new Date(aPeak.date)) : "no obvious month"
      }. ${B} peaks in ${
        bPeak.value ? monthName(new Date(bPeak.date)) : "no obvious month"
      }. These spikes often line up with big news, events or marketing pushes.`
    );
  }

  if (xo.count > 0) {
    longForm.push(
      `The two lines swap the lead ${xo.count} time${
        xo.count === 1 ? "" : "s"
      }. The latest crossover appears around ${
        xo.last ? dayName(new Date(xo.last)) : "a recent date"
      }, which hints at shifting interest between the two topics.`
    );
  } else {
    longForm.push(
      `There is no clear crossover here. One term keeps the lead almost the entire way, which usually points to a more durable long run advantage.`
    );
  }

  longForm.push(
    `${A} looks ${aVol} overall with a ${aTrend} trend. ${B} looks ${bVol} with a ${bTrend} trend. Steady, slow moving lines usually reflect stable evergreen interest, while choppier lines tend to follow news and social media spikes.`
  );

  /* ------------ scale explainer and hints ------------ */

  const scaleExplainer =
    "Scores come from Google Trends. Each line is scaled to that term’s own peak in the selected period, so focus on the shape of the lines, the timing of peaks and who is ahead rather than the raw numbers.";

  const broad = looksBroad(A) && looksBroad(B);
  const infoNote = broad
    ? "These are broad topics, so the chart mostly reflects general curiosity. If you want a more focused view, try comparing more specific phrases or product names."
    : null;

  const suggestions: string[] = [];
  if (broad) {
    suggestions.push(
      `${A} vs ${B} meaning`,
      `${A} vs ${B} definition`,
      `${A} alternatives`
    );
  }

  return {
    summary,
    extraBullets,
    atAGlance,
    table,
    scaleExplainer,
    infoNote,
    suggestions,
    longForm,
  };
}
