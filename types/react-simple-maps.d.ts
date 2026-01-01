/**
 * Type definitions for react-simple-maps
 */

declare module 'react-simple-maps' {
  import { ReactNode } from 'react';

  export interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    [key: string]: any;
  }

  export interface Geography {
    rsmKey: string;
    properties: {
      [key: string]: any;
      ISO_A2?: string;
      ISO_A2_EH?: string;
      NAME?: string;
    };
    [key: string]: any;
  }

  export interface ComposableMapProps {
    projectionConfig?: ProjectionConfig;
    style?: React.CSSProperties;
    children?: ReactNode;
    [key: string]: any;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: Geography[] }) => ReactNode;
    [key: string]: any;
  }

  export interface GeographyProps {
    geography: Geography;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    [key: string]: any;
  }

  export interface ZoomableGroupProps {
    children: ReactNode;
    [key: string]: any;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    [key: string]: any;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
}

