export type SeriesPoint = { date: string; [term: string]: number | string };

export async function fetchSeries(terms: string[]): Promise<SeriesPoint[]> {
  const now = new Date();
  const weeks = 52;
  const out: SeriesPoint[] = [];
  for (let i = weeks; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const row: Record<string, number | string> = { date: d.toISOString().slice(0, 10) };
    terms.forEach((t, idx) => {
      row[t] = Math.max(10, Math.round(60 + 15 * Math.sin((i + idx) / 5) + Math.random() * 20));
    });
    out.push(row as SeriesPoint);
  }
  return out;
}
