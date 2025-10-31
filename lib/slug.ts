import slugifyRaw from "slugify";

const s = (t: string) =>
  slugifyRaw(t, { lower: true, strict: true, trim: true })
    .replace(/-+/g, "-")
    .slice(0, 40);

export function toCanonicalSlug(inputs: string[]) {
  const cleaned = inputs.map(x => s(x)).filter(Boolean);
  const unique = Array.from(new Set(cleaned)).slice(0, 3);
  unique.sort(); // a-vs-b === b-vs-a
  if (unique.length < 2) return null;
  return unique.join("-vs-");
}

export function fromSlug(slug?: string | string[]) {
  if (!slug) return [];
  const value = Array.isArray(slug) ? slug[0] : slug;
  return value.split("-vs-").filter(Boolean);
}