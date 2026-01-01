/**
 * Geographic Map Component
 * Real choropleth map using react-simple-maps
 * Client-only component (lazy-loaded)
 */

'use client';

import { useState, useMemo } from 'react';
import { Globe, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { MapDataPoint } from '@/lib/geographic-map-data';
import { getCountryColor } from '@/lib/geographic-map-data';
import { normalizeRegionDataForMap, joinMapDataWithFeature, type GeoFeature } from '@/lib/map-data-joiner';

interface GeographicMapProps {
  mapData: MapDataPoint[];
  termA: string;
  termB: string;
}

// Dynamically import react-simple-maps to avoid SSR issues
const ComposableMap = dynamic(() => import('react-simple-maps').then(mod => mod.ComposableMap), { ssr: false });
const Geographies = dynamic(() => import('react-simple-maps').then(mod => mod.Geographies), { ssr: false });
const Geography = dynamic(() => import('react-simple-maps').then(mod => mod.Geography), { ssr: false });
const ZoomableGroup = dynamic(() => import('react-simple-maps').then(mod => mod.ZoomableGroup), { ssr: false });

// World map topojson URL (using a CDN-hosted world map)
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export default function GeographicMap({ mapData, termA, termB }: GeographicMapProps) {
  const [mode, setMode] = useState<'winner' | 'margin'>('winner');
  const [hoveredCountry, setHoveredCountry] = useState<MapDataPoint | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Log for debugging
  console.log('[GeographicMap] Rendering with:', {
    mapDataLength: mapData?.length || 0,
    hasMapData: !!mapData && mapData.length > 0,
    termA,
    termB,
  });

  if (!mapData || mapData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">Regional Map</h3>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-600">Regional data is unavailable for this comparison.</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">Regional Map</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">Error loading map: {mapError}</p>
        </div>
      </div>
    );
  }

  const termAPretty = termA.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const termBPretty = termB.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Normalize and create lookup map for efficient joining
  const dataByCountry = useMemo(() => {
    return normalizeRegionDataForMap(mapData);
  }, [mapData]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">Regional Map</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('winner')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              mode === 'winner'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Winner
          </button>
          <button
            onClick={() => setMode('margin')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              mode === 'margin'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Margin
          </button>
        </div>
      </div>

      {/* Map visualization */}
      <div className="relative bg-slate-50 rounded-lg border border-slate-200 p-4 mb-4" style={{ minHeight: '450px' }}>
        <ComposableMap
            projectionConfig={{
              scale: 147,
              center: [0, 20],
            }}
            style={{ width: '100%', height: '450px' }}
          >
            <ZoomableGroup>
              <Geographies geography={geoUrl}>
                {({ geographies }) => {
                  if (!geographies || geographies.length === 0) {
                    console.warn('[GeographicMap] No geographies loaded');
                    return null;
                  }
                  
                  return geographies.map((geo) => {
                    try {
                      // Use improved data joiner that handles multiple property names
                      const dataPoint = joinMapDataWithFeature(geo as GeoFeature, dataByCountry);
                      
                      if (!dataPoint) {
                        // No data for this country - show in light gray
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#e2e8f0"
                            stroke="#cbd5e1"
                            strokeWidth={0.5}
                          />
                        );
                      }

                      const fillColor = getCountryColor(dataPoint, mode);
                      const isHovered = hoveredCountry?.countryCode === dataPoint.countryCode;
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isHovered ? fillColor : fillColor}
                          stroke={isHovered ? "#1e293b" : "#fff"}
                          strokeWidth={isHovered ? 1.5 : 0.5}
                          style={{
                            default: { 
                              outline: 'none',
                              cursor: 'pointer',
                            },
                            hover: {
                              fill: fillColor,
                              outline: 'none',
                              cursor: 'pointer',
                              stroke: "#1e293b",
                              strokeWidth: 1.5,
                            },
                            pressed: {
                              outline: 'none',
                            },
                          }}
                          onMouseEnter={() => setHoveredCountry(dataPoint)}
                          onMouseLeave={() => setHoveredCountry(null)}
                        />
                      );
                    } catch (error) {
                      console.error('[GeographicMap] Error rendering geography:', error, geo);
                      return null;
                    }
                  });
                }}
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Tooltip */}
          {hoveredCountry && (
            <div className="absolute top-4 right-4 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl z-10 pointer-events-none max-w-xs">
              <p className="font-bold mb-1">{hoveredCountry.countryName}</p>
              <p>{termAPretty}: {hoveredCountry.termAValue.toFixed(1)}</p>
              <p>{termBPretty}: {hoveredCountry.termBValue.toFixed(1)}</p>
              <p className="mt-1 pt-1 border-t border-slate-700">
                Winner: {hoveredCountry.winner === 'termA' ? termAPretty : hoveredCountry.winner === 'termB' ? termBPretty : 'Tie'}
              </p>
              <p>Margin: {hoveredCountry.margin.toFixed(1)} points</p>
            </div>
          )}
        </div>

      {/* Enhanced Legend - Always visible and readable */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-4 mb-3">
        <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          Map Legend
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-white rounded-lg p-2 border border-blue-200">
            <div className="w-6 h-6 rounded shadow-sm bg-blue-600 border-2 border-blue-700"></div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">{termAPretty}</span>
              <span className="text-xs text-slate-500">Leading</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg p-2 border border-purple-200">
            <div className="w-6 h-6 rounded shadow-sm bg-purple-600 border-2 border-purple-700"></div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">{termBPretty}</span>
              <span className="text-xs text-slate-500">Leading</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg p-2 border border-slate-200">
            <div className="w-6 h-6 rounded shadow-sm bg-slate-400 border-2 border-slate-500"></div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">Tie / No Data</span>
              <span className="text-xs text-slate-500">Competitive</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200">
          💡 <strong>Tip:</strong> Hover over countries to see detailed statistics. 
          {mode === 'winner' ? ' Switch to "Margin" mode to see intensity of dominance.' : ' Switch to "Winner" mode for simpler categorization.'}
        </p>
      </div>

      {/* Note */}
      <div className="flex items-start gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>Regions reflect relative interest from Google Trends. Map shows countries with available data.</p>
      </div>
    </div>
  );
}
