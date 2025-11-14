// lib/validateTermsServer.ts
import isUrl from "is-url-superb";
import leo from "leo-profanity";
import removeAccents from "remove-accents";

type Result =
  | { ok: true; term: string }
  | { ok: false; reason: string };

const MAX_LEN = 60;
const MIN_LEN = 2;

// Allow letters, numbers, spaces, and a few safe symbols
const SAFE = /^[a-z0-9\s\.\-+&'’#]+$/i;

/**
 * Very conservative gibberish check.
 * Only blocks crazy strings that will never be real queries.
 */
function looksGibberish(raw: string): boolean {
  const t = raw.toLowerCase().trim();

  if (!t) return true;

  // Single character
  if (t.length === 1) return true;

  // Only symbols (no letters or numbers)
  if (!/[a-z0-9]/i.test(t)) return true;

  // Very long no-space string without vowels
  const noSpace = t.replace(/\s+/g, "");
  if (
    noSpace.length > 40 &&
    !/[aeiou]/.test(noSpace) &&
    /^[a-z]+$/.test(noSpace)
  ) {
    return true;
  }

  // Same char repeated many times (aaaaa or 111111)
  if (/(.)\1{7,}/.test(noSpace)) return true;

  return false;
}

function clean(input: string): string {
  let x = input.trim();

  // Strip accents so "José" and "Jose" behave similarly
  x = removeAccents(x);

  // Collapse multiple spaces
  x = x.replace(/\s+/g, " ");

  return x;
}

export function validateTopic(input: string): Result {
  const term = clean(input);

  if (!term) return { ok: false, reason: "empty" };
  if (term.length < MIN_LEN) return { ok: false, reason: "short" };
  if (term.length > MAX_LEN) return { ok: false, reason: "long" };

  // Block URLs directly
  if (isUrl(term) || /https?:\/\//i.test(term)) {
    return { ok: false, reason: "url" };
  }

  // Basic safe character whitelist
  if (!SAFE.test(term)) {
    return { ok: false, reason: "charset" };
  }

  // Profanity filter with default dictionary
  if (leo.check(term)) {
    return { ok: false, reason: "profanity" };
  }

  // Gibberish check, but very lenient to avoid false blocks
  if (looksGibberish(term)) {
    return { ok: false, reason: "gibberish" };
  }

  return { ok: true, term };
}
