/**
 * Geographic Data Fetcher
 * Fetches real regional interest data from Google Trends API
 * Uses interestByRegion to get country-level data
 */

import googleTrends from "google-trends-api";
import { COUNTRY_CODES } from "./geographic-map-data";

/**
 * Convert sluggy tokens back to phrases and quote multi-word terms so Google Trends
 * treats them as exact phrases.
 * 
 * Examples:
 * - "open-ai"   -> "open ai" -> "\"open ai\""
 * - "iphone-16" -> "iphone 16" -> "\"iphone 16\""
 * - "gemini"    -> "gemini"
 * - already quoted -> unchanged
 */
function normalizeTerm(term: string): string {
  let t = (term ?? "").trim();

  // If it looks slugified (has '-' but no spaces), convert dashes to spaces.
  // We avoid touching terms that already have spaces or quotes.
  if (t.includes("-") && !t.includes(" ") && !/^".+"$/.test(t)) {
    t = t.replace(/-/g, " ");
  }

  // If it now contains whitespace and isn't already quoted, wrap in quotes for phrase match.
  if (/\s/.test(t) && !/^".+"$/.test(t)) {
    t = `"${t}"`;
  }

  return t;
}

type RegionalData = {
  country: string;
  termA_value: number;
  termB_value: number;
  leader: string;
  advantage: number;
};

export type GeographicBreakdown = {
  termA_dominance: RegionalData[];
  termB_dominance: RegionalData[];
  competitive_regions: RegionalData[];
};

// Reverse mapping: country code to country name (for mapping Google Trends geo codes)
const CODE_TO_COUNTRY: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_CODES).map(([name, code]) => [code, name])
);

// Google Trends returns geo codes, we need to map them to country names
// Some common mappings (Google Trends uses ISO codes)
const GEO_CODE_TO_COUNTRY: Record<string, string> = {
  // Major countries
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'IN': 'India',
  'CN': 'China',
  'BR': 'Brazil',
  'RU': 'Russia',
  'MX': 'Mexico',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'LK': 'Sri Lanka',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'TR': 'Turkey',
  'EG': 'Egypt',
  'IR': 'Iran',
  'IQ': 'Iraq',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'PL': 'Poland',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'GR': 'Greece',
  'PT': 'Portugal',
  'KR': 'South Korea',
  'ID': 'Indonesia',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'PH': 'Philippines',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'NZ': 'New Zealand',
  'ZA': 'South Africa',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'GH': 'Ghana',
  'ET': 'Ethiopia',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'VE': 'Venezuela',
  'UA': 'Ukraine',
  'RO': 'Romania',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'FI': 'Finland',
  'IE': 'Ireland',
  'IL': 'Israel',
  'AF': 'Afghanistan',
  'NP': 'Nepal',
};

/**
 * Fetch interest by region data from Google Trends
 */
async function fetchInterestByRegion(
  keyword: string,
  options?: { timeframe?: string; geo?: string }
): Promise<Map<string, number>> {
  try {
    const normalizedKeyword = normalizeTerm(keyword);
    console.log('[GeographicData] Fetching interest by region for:', normalizedKeyword);
    
    // Resolve timeframe for date range
    const now = new Date();
    const days = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    let startTime: Date | undefined;
    let endTime: Date = now;
    
    switch ((options?.timeframe ?? "12m").toLowerCase()) {
      case "7d": startTime = days(7); break;
      case "30d": startTime = days(30); break;
      case "12m": startTime = days(365); break;
      case "5y": startTime = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()); break;
      default: startTime = days(365);
    }

    // @ts-ignore - interestByRegion exists but may not be in type definitions
    const res = await googleTrends.interestByRegion({
      keyword: normalizedKeyword,
      geo: options?.geo ?? '',
      startTime,
      endTime,
      resolution: 'COUNTRY', // Get country-level data
    });

    // Check if response is HTML (error page)
    if (typeof res === 'string' && (res.trim().startsWith('<') || res.includes('<!DOCTYPE') || res.includes('<html'))) {
      console.warn(`[GeographicData] ⚠️ Google Trends returned HTML for "${normalizedKeyword}", likely rate-limited`);
      return new Map();
    }

    let data;
    try {
      data = JSON.parse(res);
    } catch (parseError: any) {
      console.error(`[GeographicData] ❌ Failed to parse JSON response for "${normalizedKeyword}":`, parseError?.message || parseError);
      console.error(`[GeographicData] Response preview:`, typeof res === 'string' ? res.substring(0, 200) : String(res).substring(0, 200));
      return new Map();
    }
    
    // Google Trends API structure: data.default.geoMapData is an array of {geoCode, value, geoName}
    const geoMapData = data?.default?.geoMapData || [];
    
    console.log(`[GeographicData] Received ${geoMapData.length} regions for "${normalizedKeyword}"`);
    
    if (geoMapData.length === 0) {
      console.warn(`[GeographicData] ⚠️ No geoMapData in response for "${normalizedKeyword}"`);
      console.log(`[GeographicData] Response structure:`, {
        hasDefault: !!data?.default,
        defaultKeys: data?.default ? Object.keys(data.default) : [],
        topLevelKeys: Object.keys(data || {}),
      });
    }

    // Convert to Map<countryName, value>
    const result = new Map<string, number>();
    
    for (const item of geoMapData) {
      // Try different property names for geo code
      const geoCode = item.geoCode || item.geo || '';
      // Value can be a number or array
      const value = Array.isArray(item.value) 
        ? Number(item.value[0] ?? 0)
        : Number(item.value ?? 0);
      
      // Try to get country name from geoCode mapping or use geoName if available
      const countryName = item.geoName || GEO_CODE_TO_COUNTRY[geoCode] || CODE_TO_COUNTRY[geoCode];
      
      if (countryName && value > 0) {
        result.set(countryName, value);
      }
    }
    
    console.log(`[GeographicData] ✅ Mapped ${result.size} countries with data for "${normalizedKeyword}"`);
    
    if (result.size === 0 && geoMapData.length > 0) {
      console.warn(`[GeographicData] ⚠️ Received ${geoMapData.length} regions but mapped 0 countries. Sample item:`, geoMapData[0]);
    }

    return result;
  } catch (error: any) {
    console.error(`[GeographicData] ❌ Error fetching interestByRegion for "${keyword}":`, error?.message || error);
    console.error(`[GeographicData] Error stack:`, error?.stack);
    return new Map();
  }
}

/**
 * Get geographic breakdown data from Google Trends
 * Fetches real regional interest data for both terms and compares them
 */

export async function getGeographicBreakdown(
  termA: string,
  termB: string,
  series: Array<{ date: string; [key: string]: any }>,
  options?: { timeframe?: string; geo?: string }
): Promise<GeographicBreakdown> {
  try {
    console.log(`[GeographicData] Starting geographic breakdown for "${termA}" vs "${termB}"`);
    
    // Fetch geographic data for both terms in parallel
    const [geoDataA, geoDataB] = await Promise.all([
      fetchInterestByRegion(termA, options),
      fetchInterestByRegion(termB, options),
    ]);

    console.log(`[GeographicData] Fetched data - TermA: ${geoDataA.size} countries, TermB: ${geoDataB.size} countries`);

    // Get all countries that have data for at least one term
    const allCountries = new Set<string>([
      ...Array.from(geoDataA.keys()),
      ...Array.from(geoDataB.keys()),
    ]);

    if (allCountries.size === 0) {
      // No geographic data available
      console.warn(`[GeographicData] ⚠️ No geographic data available for "${termA}" vs "${termB}"`);
      console.log(`[GeographicData] TermA data size: ${geoDataA.size}, TermB data size: ${geoDataB.size}`);
      return {
        termA_dominance: [],
        termB_dominance: [],
        competitive_regions: [],
      };
    }

    // Build regional data by comparing both terms
    const regionalData: RegionalData[] = Array.from(allCountries).map((country) => {
      const valueA = geoDataA.get(country) || 0;
      const valueB = geoDataB.get(country) || 0;

      const leader = valueA > valueB ? termA : termB;
      const advantage = Math.abs(valueA - valueB);

      return {
        country,
        termA_value: valueA,
        termB_value: valueB,
        leader,
        advantage,
      };
    });

    // Categorize regions
    const breakdown: GeographicBreakdown = {
      termA_dominance: [],
      termB_dominance: [],
      competitive_regions: [],
    };

    regionalData.forEach((region) => {
      // Mark as competitive if advantage is very small (< 10 points)
      // Countries with advantage >= 10 go to dominance lists
      if (region.advantage < 10) {
        breakdown.competitive_regions.push(region);
      } else if (region.leader === termA) {
        breakdown.termA_dominance.push(region);
      } else {
        breakdown.termB_dominance.push(region);
      }
    });

    // Sort by advantage (descending for dominance, ascending for competitive)
    breakdown.termA_dominance.sort((a, b) => b.advantage - a.advantage);
    breakdown.termB_dominance.sort((a, b) => b.advantage - a.advantage);
    breakdown.competitive_regions.sort((a, b) => a.advantage - b.advantage);

    console.log(`[GeographicData] ✅ Breakdown complete - TermA dominance: ${breakdown.termA_dominance.length}, TermB dominance: ${breakdown.termB_dominance.length}, Competitive: ${breakdown.competitive_regions.length}`);

    return breakdown;
  } catch (error: any) {
    console.error('[GeographicData] ❌ Error getting geographic breakdown:', error?.message || error);
    console.error('[GeographicData] Error stack:', error?.stack);
    // Return empty data on error
    return {
      termA_dominance: [],
      termB_dominance: [],
      competitive_regions: [],
    };
  }
}
