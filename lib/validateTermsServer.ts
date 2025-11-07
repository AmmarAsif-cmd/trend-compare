// lib/validateTermsServer.ts
import "server-only";
import leo from "leo-profanity";
import isUrl from "is-url-superb";
import removeAccents from "remove-accents";

export type DeepValidation = {
  ok: boolean;
  term?: string;
  reason?: string;
};

const ZERO_WIDTH = /[\u200B-\u200F\uFEFF]/g; // zero-width chars
const MULTI_SPACES = /\s{2,}/g;

// Keep aligned with client STOP_PHRASES (you can centralize later if you want)
const STOP_PHRASES = [
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
  "bet", "casino", "gambling", "drug", "weed", "marijuana",
].map(s => s.toLowerCase());

function normalize(raw: string) {
  let t = raw.normalize("NFKC");      // Unicode normalize
  t = t.replace(ZERO_WIDTH, "");      // strip zero-width
  t = t.replace(/[^A-Za-z0-9 \-]/g, " "); // keep letters/digits/space/hyphen
  t = t.replace(MULTI_SPACES, " ").trim();
  return t;
}

function hasStopPhrase(t: string) {
  const lower = t.toLowerCase();
  return STOP_PHRASES.some(p => lower.includes(p));
}

function looksGibberish(word: string) {
  const w = word.toLowerCase();
  const hasVowel = /[aeiou]/.test(w);
  const digits = (w.match(/\d/g)?.length ?? 0);
  const digitRatio = digits / Math.max(w.length, 1);
  const repeats = /(.)\1\1\1/.test(w);
  const tooLong = w.length > 32;
  const consonantStreak = /[bcdfghjklmnpqrstvwxyz]{6,}/i.test(w);
  return !hasVowel || digitRatio > 0.5 || repeats || tooLong || consonantStreak;
}

function mixedScriptsSuspicious(input: string) {
  // Simple mixed-script heuristic without external deps
  const hasLatin = /[A-Za-z]/.test(input);
  const hasCyril = /[\u0400-\u04FF]/.test(input);
  const hasGreek = /[\u0370-\u03FF]/.test(input);
  const hasArabic = /[\u0600-\u06FF]/.test(input);
  const hasDevanagari = /[\u0900-\u097F]/.test(input);
  const groups = [hasLatin, hasCyril, hasGreek, hasArabic, hasDevanagari].filter(Boolean).length;
  return groups >= 2; // multiple scripts mixed is suspicious for our use case
}

function isEmailLike(t: string) {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(t);
}

export function deepValidateTerm(raw: string): DeepValidation {
  if (!raw) return { ok: false, reason: "empty" };

  let t = normalize(raw);
  if (!t || t.length < 2) return { ok: false, reason: "too-short" };

  if (isUrl(t)) return { ok: false, reason: "url" };
  if (isEmailLike(t)) return { ok: false, reason: "email" };

  // Normalize accents for consistent slugs/display
  const tNoAccents = removeAccents(t);

  if (hasStopPhrase(tNoAccents)) return { ok: false, reason: "stop-phrase" };

  // Profanity (multi-language)
  if (leo.check(tNoAccents)) return { ok: false, reason: "profanity" };

  // Token-level checks
  const toks = tNoAccents.split(/[-\s]/).filter(Boolean);
  if (toks.length > 6) return { ok: false, reason: "too-many-words" };
  if (toks.some(looksGibberish)) return { ok: false, reason: "gibberish" };

  // At least 3 alphabetic chars overall
  if ((tNoAccents.match(/[A-Za-z]/g)?.length ?? 0) < 3) {
    return { ok: false, reason: "too-few-letters" };
  }

  // Mixed scripts (homoglyph-ish suspicion)
  if (mixedScriptsSuspicious(raw)) return { ok: false, reason: "mixed-scripts" };

  return { ok: true, term: tNoAccents };
}
