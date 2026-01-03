// lib/validateTerms.ts (client-side lightweight mirror)
import removeAccents from "remove-accents";

const STOP_PHRASES = [
  "near me", "lyrics", "mp3", "torrent", "porn", "xxx", "sex", "adult",
  "free download", "crack", "serial key"
];

// Whitelist for known legitimate terms with special characters
const WHITELIST_TERMS = new Set([
  // Programming languages
  'c++', 'c#', 'f#', '.net',
  'node.js', 'next.js', 'vue.js', 'react.js', 'angular.js', 'svelte.js',
  
  // Tech brands/products
  'x.com', 'disney+',
  
  // Other common terms with special chars
  'booking.com', 't.co',
]);

const SAFE_SHAPE = /^[a-z0-9][a-z0-9 .+\-]{0,58}[a-z0-9]$/i;
// Allow special characters at end for terms with dots, plus, hash, etc.
const SAFE_SHAPE_WITH_SPECIAL_END = /^[a-z0-9][a-z0-9 .+\-#&']{0,58}[a-z0-9.+\-#&']$/i;

const MAX_LEN = 60;
const MAX_TOKEN_LEN = 24;
const MIN_CHAR_DIVERSITY = 3;

function normalize(raw: string) {
  return removeAccents(String(raw)).trim().replace(/\s+/g, " ");
}

function hasRepeatRun(t: string) {
  return /(.)\1{4,}/i.test(t);
}

function charDiversityOK(t: string) {
  const lettersDigits = t.replace(/[^a-z0-9]/gi, "");
  if (lettersDigits.length <= 5) return true;
  const unique = new Set(lettersDigits.toLowerCase());
  return unique.size >= MIN_CHAR_DIVERSITY;
}

export function cleanTerm(raw: string) {
  return normalize(raw);
}

export function isTermAllowed(raw: string) {
  const t = normalize(raw);
  if (!t) return false;
  if (t.length < 2 || t.length > MAX_LEN) return false;
  
  const lower = t.toLowerCase();
  
  // Whitelist check - allow known legitimate terms with special characters
  if (WHITELIST_TERMS.has(lower)) {
    return true;
  }
  
  if (STOP_PHRASES.some(p => lower.includes(p))) return false;
  
  // Use more lenient shape check that allows special characters at the end
  if (!SAFE_SHAPE.test(t) && !SAFE_SHAPE_WITH_SPECIAL_END.test(t)) return false;
  
  if (t.split(/\s+/).some(tok => tok.length > MAX_TOKEN_LEN)) return false;
  if (hasRepeatRun(t)) return false;
  if (!charDiversityOK(t)) return false;
  const lettersOrDigits = t.replace(/[^a-z0-9]/gi, "").length;
  if (lettersOrDigits < 2) return false;
  return true;
}