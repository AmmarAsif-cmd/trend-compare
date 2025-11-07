// lib/validateTerms.ts
export const STOP_PHRASES = [
  // spam & location
  "near me", "location", "map",

  // low quality / piracy
  "lyrics", "mp3", "song", "torrent", "movie", "download", "free download",
  "watch online", "stream", "episode",

  // explicit / adult
  "porn", "xxx", "sex", "adult", "nude", "nsfw",

  // scam / hacking
  "hack", "crack", "generator", "cheat", "mod", "proxy", "vpn", "keygen", "serial", "code",

  // gambling / drugs
  "bet", "casino", "gambling", "drug", "weed", "marijuana"
];

function looksGibberish(word: string) {
  const w = word.toLowerCase();
  const hasVowel = /[aeiou]/.test(w);
  const digitRatio = (w.match(/\d/g)?.length ?? 0) / Math.max(1, w.length);
  const repeats = /(.)\1\1\1/.test(w);
  const tooLong = w.length > 28;
  const consonantStreak = /[bcdfghjklmnpqrstvwxyz]{6,}/i.test(w);
  return !hasVowel || digitRatio > 0.5 || repeats || tooLong || consonantStreak;
}

export function cleanTerm(raw: string) {
  // keep letters, numbers, spaces, hyphens
  return raw.replace(/[^a-zA-Z0-9 \-]/g, " ").replace(/\s+/g, " ").trim();
}

export function isTermAllowed(term: string) {
  const t = term.toLowerCase();
  if (!t || t.length < 2) return false;
  if (STOP_PHRASES.some(p => t.includes(p))) return false;

  const toks = t.split(/[-\s]/).filter(Boolean);
  if (toks.length > 6) return false;
  if (toks.some(looksGibberish)) return false;

  // at least 3 alphabetic characters overall
  if ((t.match(/[a-z]/gi)?.length ?? 0) < 3) return false;

  return true;
}
