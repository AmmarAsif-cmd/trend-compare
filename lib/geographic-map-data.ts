/**
 * Geographic Map Data Transformer
 * Transforms regional breakdown data into map-friendly format
 */

import type { GeographicBreakdown } from './getGeographicData';

export interface MapDataPoint {
  countryCode: string;
  countryName: string;
  termAValue: number;
  termBValue: number;
  winner: 'termA' | 'termB' | 'tie';
  margin: number;
}

// Country name to ISO 3166-1 alpha-2 code mapping (common countries)
// Extended mapping for better coverage
// Export for use in map-data-joiner
export const COUNTRY_CODES: Record<string, string> = {
  'United States': 'US',
  'United Kingdom': 'GB',
  'Canada': 'CA',
  'Australia': 'AU',
  'Germany': 'DE',
  'France': 'FR',
  'Japan': 'JP',
  'India': 'IN',
  'Brazil': 'BR',
  'Singapore': 'SG',
  'Spain': 'ES',
  'Italy': 'IT',
  'Netherlands': 'NL',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Poland': 'PL',
  'Russia': 'RU',
  'China': 'CN',
  'South Korea': 'KR',
  'Mexico': 'MX',
  'Argentina': 'AR',
  'Chile': 'CL',
  'South Africa': 'ZA',
  'New Zealand': 'NZ',
  'Ireland': 'IE',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Portugal': 'PT',
  'Greece': 'GR',
  'Turkey': 'TR',
  'Saudi Arabia': 'SA',
  'United Arab Emirates': 'AE',
  'Israel': 'IL',
  'Thailand': 'TH',
  'Malaysia': 'MY',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'Vietnam': 'VN',
  'Taiwan': 'TW',
  'Hong Kong': 'HK',
  'Pakistan': 'PK',
  'Bangladesh': 'BD',
  'Egypt': 'EG',
  'Nigeria': 'NG',
  'Kenya': 'KE',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Venezuela': 'VE',
  'Ukraine': 'UA',
  'Romania': 'RO',
  'Czech Republic': 'CZ',
  'Hungary': 'HU',
  'Finland': 'FI',
  'Croatia': 'HR',
  'Serbia': 'RS',
  'Bulgaria': 'BG',
  'Morocco': 'MA',
  'Algeria': 'DZ',
  'Tunisia': 'TN',
  'Ghana': 'GH',
  'Ethiopia': 'ET',
  'Tanzania': 'TZ',
  'Uganda': 'UG',
  'Ecuador': 'EC',
  'Bolivia': 'BO',
  'Paraguay': 'PY',
  'Uruguay': 'UY',
  'Costa Rica': 'CR',
  'Panama': 'PA',
  'Guatemala': 'GT',
  'Dominican Republic': 'DO',
  'Cuba': 'CU',
  'Jamaica': 'JM',
  'Trinidad and Tobago': 'TT',
  'Bahrain': 'BH',
  'Kuwait': 'KW',
  'Qatar': 'QA',
  'Oman': 'OM',
  'Jordan': 'JO',
  'Lebanon': 'LB',
  'Iraq': 'IQ',
  'Iran': 'IR',
  'Afghanistan': 'AF',
  'Nepal': 'NP',
  'Sri Lanka': 'LK',
  'Myanmar': 'MM',
  'Cambodia': 'KH',
  'Laos': 'LA',
  'Mongolia': 'MN',
  'Kazakhstan': 'KZ',
  'Uzbekistan': 'UZ',
  'Azerbaijan': 'AZ',
  'Georgia': 'GE',
  'Armenia': 'AM',
  'Belarus': 'BY',
  'Lithuania': 'LT',
  'Latvia': 'LV',
  'Estonia': 'EE',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'Bosnia and Herzegovina': 'BA',
  'Macedonia': 'MK',
  'Albania': 'AL',
  'Moldova': 'MD',
  'Kosovo': 'XK',
  'Montenegro': 'ME',
  'Cyprus': 'CY',
  'Malta': 'MT',
  'Luxembourg': 'LU',
  'Iceland': 'IS',
  'Greenland': 'GL',
  'Fiji': 'FJ',
  'Papua New Guinea': 'PG',
  'New Caledonia': 'NC',
  'French Polynesia': 'PF',
  'Samoa': 'WS',
  'Tonga': 'TO',
  'Vanuatu': 'VU',
  'Solomon Islands': 'SB',
  'Palau': 'PW',
  'Micronesia': 'FM',
  'Marshall Islands': 'MH',
  'Kiribati': 'KI',
  'Tuvalu': 'TV',
  'Nauru': 'NR',
  'Cook Islands': 'CK',
  'Niue': 'NU',
  'Tokelau': 'TK',
  'Pitcairn': 'PN',
  'Wallis and Futuna': 'WF',
  'American Samoa': 'AS',
  'Guam': 'GU',
  'Northern Mariana Islands': 'MP',
  'Puerto Rico': 'PR',
  'US Virgin Islands': 'VI',
  'British Virgin Islands': 'VG',
  'Anguilla': 'AI',
  'Montserrat': 'MS',
  'Saint Kitts and Nevis': 'KN',
  'Antigua and Barbuda': 'AG',
  'Dominica': 'DM',
  'Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC',
  'Barbados': 'BB',
  'Grenada': 'GD',
  'Belize': 'BZ',
  'El Salvador': 'SV',
  'Honduras': 'HN',
  'Nicaragua': 'NI',
  'Haiti': 'HT',
  'Suriname': 'SR',
  'Guyana': 'GY',
  'French Guiana': 'GF',
  'Martinique': 'MQ',
  'Guadeloupe': 'GP',
  'Saint Martin': 'MF',
  'Saint Barthelemy': 'BL',
  'Aruba': 'AW',
  'Curacao': 'CW',
  'Sint Maarten': 'SX',
  'Bonaire': 'BQ',
  'Saba': 'BQ',
  'Saint Eustatius': 'BQ',
  'Angola': 'AO',
  'Mozambique': 'MZ',
  'Madagascar': 'MG',
  'Cameroon': 'CM',
  'Ivory Coast': 'CI',
  'Senegal': 'SN',
  'Mali': 'ML',
  'Burkina Faso': 'BF',
  'Niger': 'NE',
  'Chad': 'TD',
  'Sudan': 'SD',
  'South Sudan': 'SS',
  'Eritrea': 'ER',
  'Djibouti': 'DJ',
  'Somalia': 'SO',
  'Rwanda': 'RW',
  'Burundi': 'BI',
  'Malawi': 'MW',
  'Zambia': 'ZM',
  'Zimbabwe': 'ZW',
  'Botswana': 'BW',
  'Namibia': 'NA',
  'Lesotho': 'LS',
  'Swaziland': 'SZ',
  'Mauritius': 'MU',
  'Seychelles': 'SC',
  'Comoros': 'KM',
  'Cape Verde': 'CV',
  'Sao Tome and Principe': 'ST',
  'Equatorial Guinea': 'GQ',
  'Gabon': 'GA',
  'Republic of the Congo': 'CG',
  'Democratic Republic of the Congo': 'CD',
  'Central African Republic': 'CF',
  'Guinea': 'GN',
  'Guinea-Bissau': 'GW',
  'Sierra Leone': 'SL',
  'Liberia': 'LR',
  'Togo': 'TG',
  'Benin': 'BJ',
  'Mauritania': 'MR',
  'Gambia': 'GM',
  'Maldives': 'MV',
  'Bhutan': 'BT',
  'Brunei': 'BN',
  'East Timor': 'TL',
  'Palestine': 'PS',
  'Yemen': 'YE',
  'Syria': 'SY',
  'Libya': 'LY',
  'Western Sahara': 'EH',
  'Sahrawi Arab Democratic Republic': 'EH',
  'Somaliland': 'SO',
  'Puntland': 'SO',
  'Galmudug': 'SO',
  'Hirshabelle': 'SO',
  'South West State': 'SO',
  'Jubaland': 'SO',
  'Khatumo': 'SO',
  'North Korea': 'KP',
  'Macau': 'MO',
  'Tibet': 'CN',
  'Xinjiang': 'CN',
  'Inner Mongolia': 'CN',
  'Guangxi': 'CN',
  'Ningxia': 'CN',
  'Qinghai': 'CN',
  'Gansu': 'CN',
  'Shaanxi': 'CN',
  'Shanxi': 'CN',
  'Hebei': 'CN',
  'Tianjin': 'CN',
  'Beijing': 'CN',
  'Shanghai': 'CN',
  'Chongqing': 'CN',
  'Sichuan': 'CN',
  'Yunnan': 'CN',
  'Guizhou': 'CN',
  'Hunan': 'CN',
  'Hubei': 'CN',
  'Henan': 'CN',
  'Shandong': 'CN',
  'Jiangsu': 'CN',
  'Anhui': 'CN',
  'Zhejiang': 'CN',
  'Jiangxi': 'CN',
  'Fujian': 'CN',
  'Guangdong': 'CN',
  'Hainan': 'CN',
  'Liaoning': 'CN',
  'Jilin': 'CN',
  'Heilongjiang': 'CN',
};

/**
 * Transform geographic breakdown into map data points
 */
export function transformGeoDataForMap(
  geoData: GeographicBreakdown
): MapDataPoint[] {
  const mapData: MapDataPoint[] = [];
  const allRegions = [
    ...geoData.termA_dominance,
    ...geoData.termB_dominance,
    ...geoData.competitive_regions,
  ];

  for (const region of allRegions) {
    const countryCode = COUNTRY_CODES[region.country] || null;
    if (!countryCode) continue; // Skip if we don't have a code

    const margin = Math.abs(region.termA_value - region.termB_value);
    const winner: 'termA' | 'termB' | 'tie' =
      margin < 5 ? 'tie' : region.termA_value > region.termB_value ? 'termA' : 'termB';

    mapData.push({
      countryCode,
      countryName: region.country,
      termAValue: region.termA_value,
      termBValue: region.termB_value,
      winner,
      margin,
    });
  }

  return mapData;
}

/**
 * Get color for a country based on mode
 * Stronger, more visible colors for better readability
 */
export function getCountryColor(
  point: MapDataPoint,
  mode: 'winner' | 'margin',
  termAColor: string = '#2563eb', // Stronger blue
  termBColor: string = '#9333ea' // Stronger purple
): string {
  if (mode === 'winner') {
    if (point.winner === 'termA') return termAColor;
    if (point.winner === 'termB') return termBColor;
    return '#94a3b8'; // Tie - gray
  } else {
    // Margin mode - intensity based on margin
    const maxMargin = 50; // Normalize to max margin
    const intensity = Math.min(1, point.margin / maxMargin);
    if (point.winner === 'termA') {
      // Stronger blue with better visibility
      return `rgba(37, 99, 235, ${0.5 + intensity * 0.5})`; // Blue with intensity
    } else if (point.winner === 'termB') {
      // Stronger purple with better visibility
      return `rgba(147, 51, 234, ${0.5 + intensity * 0.5})`; // Purple with intensity
    }
    return '#94a3b8';
  }
}

