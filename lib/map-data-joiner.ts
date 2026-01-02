/**
 * Map Data Joiner
 * Normalizes and joins regional data with GeoJSON features
 * Handles multiple GeoJSON property name variations
 */

import type { MapDataPoint } from './geographic-map-data';
import { COUNTRY_CODES } from './geographic-map-data';

export interface GeoFeature {
  properties: {
    ISO_A2?: string;
    ISO_A2_EH?: string;
    iso_a2?: string;
    ISO_A3?: string;
    iso_a3?: string;
    NAME?: string;
    NAME_LONG?: string;
    NAME_EN?: string;
    ADMIN?: string;
    ADM0_A3?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Extract ISO-3166 alpha-2 code from a GeoJSON feature
 * Tries multiple property names in order of preference
 * Handles world-atlas@2 topojson format
 */
export function extractCountryCode(feature: GeoFeature): string | null {
  const props = feature.properties;
  
  // world-atlas@2 uses ISO_A2 property (uppercase)
  // Try ISO_A2 first (most common in world-atlas)
  if (props.ISO_A2 && typeof props.ISO_A2 === 'string' && props.ISO_A2.length === 2 && props.ISO_A2 !== '-99') {
    return props.ISO_A2.toUpperCase();
  }
  
  // Try ISO_A2_EH (for disputed territories)
  if (props.ISO_A2_EH && typeof props.ISO_A2_EH === 'string' && props.ISO_A2_EH.length === 2 && props.ISO_A2_EH !== '-99') {
    return props.ISO_A2_EH.toUpperCase();
  }
  
  // Try lowercase variant
  if (props.iso_a2 && typeof props.iso_a2 === 'string' && props.iso_a2.length === 2 && props.iso_a2 !== '-99') {
    return props.iso_a2.toUpperCase();
  }
  
  // Try to get from ISO_A3 and convert (some maps only have ISO_A3)
  const iso3 = props.ISO_A3 || props.iso_a3;
  if (iso3 && typeof iso3 === 'string' && iso3.length === 3) {
    const code = iso3ToAlpha2(iso3.toUpperCase());
    if (code) return code;
  }
  
  // Try to match by name (world-atlas uses NAME property)
  const name = props.NAME || props.NAME_LONG || props.NAME_EN || props.ADMIN || props.name;
  
  // Debug: Log for USA specifically
  if (name && (name.includes('United States') || name === 'USA' || name === 'U.S.A.')) {
    console.log('[map-data-joiner] USA feature found:', {
      ISO_A2: props.ISO_A2,
      ISO_A2_EH: props.ISO_A2_EH,
      iso_a2: props.iso_a2,
      ISO_A3: props.ISO_A3,
      iso_a3: props.iso_a3,
      NAME: props.NAME,
      NAME_LONG: props.NAME_LONG,
      NAME_EN: props.NAME_EN,
      ADMIN: props.ADMIN,
      name: props.name,
    });
  }
  if (name && typeof name === 'string') {
    const normalizedName = name.trim();
    
    // Try exact match first
    const code = COUNTRY_CODES[normalizedName];
    if (code) return code;
    
    // Try common name variations
    const nameVariations = [
      normalizedName,
      normalizedName.replace(/\s+/g, ' '), // Normalize spaces
      normalizedName.replace(/\./g, ''), // Remove periods
      normalizedName.toUpperCase(), // Uppercase
      normalizedName.toLowerCase(), // Lowercase
    ];
    
    // Special handling for United States variations
    if (normalizedName.includes('United States') || normalizedName === 'USA' || normalizedName === 'U.S.A.' || normalizedName === 'U.S.') {
      return 'US';
    }
    
    for (const nameVar of nameVariations) {
      const code = COUNTRY_CODES[nameVar];
      if (code) return code;
    }
  }
  
  return null;
}

/**
 * Convert ISO-3166 alpha-3 to alpha-2 (common mappings)
 */
function iso3ToAlpha2(iso3: string): string | null {
  const mapping: Record<string, string> = {
    'USA': 'US',
    'GBR': 'GB',
    'CAN': 'CA',
    'AUS': 'AU',
    'DEU': 'DE',
    'FRA': 'FR',
    'JPN': 'JP',
    'IND': 'IN',
    'BRA': 'BR',
    'SGP': 'SG',
    'ESP': 'ES',
    'ITA': 'IT',
    'NLD': 'NL',
    'SWE': 'SE',
    'NOR': 'NO',
    'DNK': 'DK',
    'POL': 'PL',
    'RUS': 'RU',
    'CHN': 'CN',
    'KOR': 'KR',
    'MEX': 'MX',
    'ARG': 'AR',
    'CHL': 'CL',
    'ZAF': 'ZA',
    'NZL': 'NZ',
    'IRL': 'IE',
    'BEL': 'BE',
    'CHE': 'CH',
    'AUT': 'AT',
    'PRT': 'PT',
    'GRC': 'GR',
    'TUR': 'TR',
    'SAU': 'SA',
    'ARE': 'AE',
    'ISR': 'IL',
    'THA': 'TH',
    'MYS': 'MY',
    'IDN': 'ID',
    'PHL': 'PH',
    'VNM': 'VN',
    'TWN': 'TW',
    'HKG': 'HK',
    'PAK': 'PK',
    'BGD': 'BD',
    'EGY': 'EG',
    'NGA': 'NG',
    'KEN': 'KE',
    'COL': 'CO',
    'PER': 'PE',
    'VEN': 'VE',
    'UKR': 'UA',
    'ROU': 'RO',
    'CZE': 'CZ',
    'HUN': 'HU',
    'FIN': 'FI',
    'HRV': 'HR',
    'SRB': 'RS',
    'BGR': 'BG',
    'MAR': 'MA',
    'DZA': 'DZ',
    'TUN': 'TN',
    'GHA': 'GH',
    'ETH': 'ET',
    'TZA': 'TZ',
    'UGA': 'UG',
    'ECU': 'EC',
    'BOL': 'BO',
    'PRY': 'PY',
    'URY': 'UY',
    'CRI': 'CR',
    'PAN': 'PA',
    'GTM': 'GT',
    'DOM': 'DO',
    'CUB': 'CU',
    'JAM': 'JM',
    'TTO': 'TT',
    'BHR': 'BH',
    'KWT': 'KW',
    'QAT': 'QA',
    'OMN': 'OM',
    'JOR': 'JO',
    'LBN': 'LB',
    'IRQ': 'IQ',
    'IRN': 'IR',
    'AFG': 'AF',
    'NPL': 'NP',
    'LKA': 'LK',
    'MMR': 'MM',
    'KHM': 'KH',
    'LAO': 'LA',
    'MNG': 'MN',
    'KAZ': 'KZ',
    'UZB': 'UZ',
    'AZE': 'AZ',
    'GEO': 'GE',
    'ARM': 'AM',
    'BLR': 'BY',
    'LTU': 'LT',
    'LVA': 'LV',
    'EST': 'EE',
    'SVK': 'SK',
    'SVN': 'SI',
    'BIH': 'BA',
    'MKD': 'MK',
    'ALB': 'AL',
    'MDA': 'MD',
    'XKX': 'XK',
    'MNE': 'ME',
    'CYP': 'CY',
    'MLT': 'MT',
    'LUX': 'LU',
    'ISL': 'IS',
  };
  
  return mapping[iso3] || null;
}

/**
 * Normalize region data for map
 * Creates a lookup map by country code for efficient joining
 */
export function normalizeRegionDataForMap(
  mapData: MapDataPoint[]
): Map<string, MapDataPoint> {
  const lookup = new Map<string, MapDataPoint>();
  
  mapData.forEach(point => {
    // Store by uppercase code for case-insensitive matching
    const code = point.countryCode.toUpperCase();
    lookup.set(code, point);
  });
  
  return lookup;
}

/**
 * Join map data with GeoJSON feature
 * Returns the matching data point or null
 */
export function joinMapDataWithFeature(
  feature: GeoFeature,
  dataLookup: Map<string, MapDataPoint>
): MapDataPoint | null {
  const countryCode = extractCountryCode(feature);
  if (!countryCode) {
    // Debug: Log when we can't extract a code
    const name = feature.properties.NAME || feature.properties.NAME_LONG || feature.properties.NAME_EN;
    if (name && (name.includes('United States') || name === 'USA')) {
      console.warn('[map-data-joiner] Could not extract country code for USA feature:', {
        name,
        properties: Object.keys(feature.properties),
      });
    }
    return null;
  }
  
  // Try exact match (uppercase)
  const code = countryCode.toUpperCase();
  const result = dataLookup.get(code);
  
  // Debug: Log when USA is not found
  if (!result && code === 'US') {
    console.warn('[map-data-joiner] USA code extracted but not found in data lookup:', {
      code,
      availableCodes: Array.from(dataLookup.keys()).slice(0, 10),
      hasUS: dataLookup.has('US'),
    });
  }
  
  return result || null;
}

