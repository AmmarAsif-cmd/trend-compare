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
  // simple linear regression slope against index
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

function pct(a: number, b: number) {
  if (a === 0) return b === 0 ? 0 : 100;
  return Math.round(((b - a) / Math.abs(a)) * 100);
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
  let a = 0,
    b = 0;
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
  // suggestions: string[]; // kept as strings; page.tsx resolves them to working links
  longForm: string[]; // paragraphs for the Deep dive section (inc. 5y highlights)
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

  const summary =
    aAvg === bAvg
      ? `Both terms are close across this period.`
      : `${leader} is searched more than ${trailer} in this period, with an average gap of about ${gapPct} percent.`;

  /* short bullets */
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

  const lead = shareOfLeading(aVals, bVals);
  const xo = crossovers(aVals, bVals, dates);

  const aMonth = monthlyAverages(A, series);
  const bMonth = monthlyAverages(B, series);

  const atAGlance: string[] = [
    `Average interest: ${A} ${aAvg}, ${B} ${bAvg}`,
    `Peaks: ${A} ${
      aPeak.value ? monthName(new Date(aPeak.date)) : "none"
    }, ${B} ${bPeak.value ? monthName(new Date(bPeak.date)) : "none"}`,
    `Recent trend: ${A} ${aTrend}, ${B} ${bTrend}`,
    `Stability: ${A} ${aVol}, ${B} ${bVol}`,
    `Head to head: ${A} led ${lead.aPct} percent of the time, ${B} led ${lead.bPct} percent`,
    `Crossovers: ${xo.count}${
      xo.last ? `, last on ${dayName(new Date(xo.last))}` : ""
    }`,
  ];

  /* table */
  const table = {
    rows: [
      { label: "Average interest", a: String(aAvg), b: String(bAvg) },
      { label: "Recent trend", a: aTrend, b: bTrend },
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
      { label: "Share of leading periods", a: `${lead.aPct}%`, b: `${lead.bPct}%` },
      {
        label: "Crossovers",
        a: xo.count ? String(xo.count) : "0",
        b: xo.last ? dayName(new Date(xo.last)) : "not recent",
      },
    ],
  };

  /* extra bullets for the Summary card */
  const extraBullets: string[] = [];
  const firstA = avg(firstWindow(aVals, Math.floor(aVals.length / 3)));
  const lastA = avg(recentWindow(aVals, Math.floor(aVals.length / 3)));
  const firstB = avg(firstWindow(bVals, Math.floor(bVals.length / 3)));
  const lastB = avg(recentWindow(bVals, Math.floor(bVals.length / 3)));

  const growA = pct(firstA || 1, lastA);
  const growB = pct(firstB || 1, lastB);

  extraBullets.push(
    `${A} changed by about ${growA} percent from early to late period.`
  );
  extraBullets.push(
    `${B} changed by about ${growB} percent from early to late period.`
  );

  /* long form narrative */
  const longForm: string[] = [];
  const tf = (opts?.timeframe ?? "").toLowerCase();
  const tfText = opts?.timeframe
    ? `over the last ${opts.timeframe}`
    : "over this period";

  longForm.push(
    `This view summarises how people searched for ${A} and ${B} ${tfText}. The chart shows monthly values from zero to one hundred where one hundred marks the local high for a term.`
  );

  // ---- five-year / all-time highlights
  const wantsFiveYear = tf === "5y" || tf === "all";
  if (wantsFiveYear) {
    // Yearly averages per term
    const yearMap = new Map<number, { a: number[]; b: number[] }>();
    series.forEach((r) => {
      const d = new Date(String(r.date ?? ""));
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const vA = Number(r[A] ?? 0);
      const vB = Number(r[B] ?? 0);
      const bucket = yearMap.get(y) ?? { a: [], b: [] };
      bucket.a.push(vA);
      bucket.b.push(vB);
      yearMap.set(y, bucket);
    });

    const yearly = Array.from(yearMap.entries())
      .map(([y, v]) => ({
        year: y,
        aAvg: Math.round(avg(v.a)),
        bAvg: Math.round(avg(v.b)),
        winner: avg(v.a) === avg(v.b) ? "tie" : avg(v.a) > avg(v.b) ? A : B,
      }))
      .sort((x, y) => x.year - y.year);

    if (yearly.length >= 2) {
      const first = yearly[0];
      const last = yearly[yearly.length - 1];

      const aYoY = pct(first.aAvg || 1, last.aAvg);
      const bYoY = pct(first.bAvg || 1, last.bAvg);

      longForm.push(
        `Year by year: in ${first.year}, averages were ${A} ${first.aAvg} and ${B} ${first.bAvg}. In ${last.year}, they were ${A} ${last.aAvg} and ${B} ${last.bAvg}. That is a change of about ${aYoY} percent for ${A} and ${bYoY} percent for ${B}.`
      );

      const wins = yearly.reduce(
        (acc, r) => {
          if (r.winner === A) acc.a++;
          else if (r.winner === B) acc.b++;
          return acc;
        },
        { a: 0, b: 0 }
      );

      longForm.push(
        `Across these years the yearly average winner was ${A} in ${wins.a} year${wins.a === 1 ? "" : "s"} and ${B} in ${wins.b} year${wins.b === 1 ? "" : "s"}.`
      );
    }

    // Month seasonality by average
    const monthBuckets = Array.from({ length: 12 }, () => ({
      a: [] as number[],
      b: [] as number[],
    }));
    series.forEach((r) => {
      const d = new Date(String(r.date ?? ""));
      if (isNaN(d.getTime())) return;
      const m = d.getMonth(); // 0..11
      monthBuckets[m].a.push(Number(r[A] ?? 0));
      monthBuckets[m].b.push(Number(r[B] ?? 0));
    });
    const monthAvg = monthBuckets.map((b, i) => ({
      idx: i,
      a: b.a.length ? Math.round(avg(b.a)) : 0,
      b: b.b.length ? Math.round(avg(b.b)) : 0,
    }));
    const bestA = monthAvg.reduce((p, c) => (c.a > p.a ? c : p), monthAvg[0]);
    const bestB = monthAvg.reduce((p, c) => (c.b > p.b ? c : p), monthAvg[0]);

    longForm.push(
      `${A} tends to be highest in ${new Date(2000, bestA.idx, 1).toLocaleString(
        "en-GB",
        { month: "long" }
      )}. ${B} tends to be highest in ${new Date(2000, bestB.idx, 1).toLocaleString(
        "en-GB",
        { month: "long" }
      )}.`
    );

    if (xo.count > 0) {
      longForm.push(
        `Over the long run there were ${xo.count} lead changes. The most recent was on ${
          xo.last ? dayName(new Date(xo.last)) : "a recent date"
        }.`
      );
    }
  }

  // timeline split (works for any timeframe)
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
    `Breaking the period into thirds, averages were: early ${A} ${early.a} and ${B} ${early.b}, middle ${A} ${mid.a} and ${B} ${mid.b}, recent ${A} ${late.a} and ${B} ${late.b}.`
  );

  if (xo.count > 0) {
    longForm.push(
      `The two lines crossed ${xo.count} times. The most recent crossover was on ${
        xo.last ? dayName(new Date(xo.last)) : "a recent date"
      }, which hints at changing interest.`
    );
  } else {
    longForm.push(
      `There was no clear crossover. One term held the lead across most of the timeline.`
    );
  }

  if (aPeak.value || bPeak.value) {
    longForm.push(
      `${A} peaked in ${
        aPeak.value ? monthName(new Date(aPeak.date)) : "no obvious month"
      }, while ${B} peaked in ${
        bPeak.value ? monthName(new Date(bPeak.date)) : "no obvious month"
      }.`
    );
  }

  longForm.push(
    `${A} looks ${aVol} with a ${aTrend} trend. ${B} looks ${bVol} with a ${bTrend} trend.`
  );

  // scale explainer and helpful note
  const scaleExplainer =
    "Scores come from Google Trends. Each series is scaled to its own peak within the chosen period. Use the chart to compare direction and timing rather than total search counts.";

  const broad = looksBroad(A) && looksBroad(B);
  const infoNote = broad
    ? "These are broad topics, so values reflect general curiosity. Try a more specific term if you want a focused comparison."
    : null;

  // Suggestions: always valid compare phrases that work with internal routing.
  // Kept as strings because page.tsx turns them into working links.
  

  return {
    summary,
    extraBullets,
    atAGlance,
    table,
    scaleExplainer,
    infoNote,
    longForm,
  };
}
