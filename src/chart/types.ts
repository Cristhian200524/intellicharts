import { ChartTheme } from '../theme';

/**
 * Configuration options for a single Chart instance.
 */
export interface ChartConfig {
  /** Optional unique identifier for the chart */
  id?: string;
  /** The visual representation type of the chart */
  type: 'bar' | 'line' | 'pie' | 'donut' | 'radar' | 'card' | 'funnel';
  /** The object property used to group records */
  dimension: string;
  /** The object property value to aggregate */
  measure: string;
  /** Optional header title for the chart card */
  title?: string;
  /** Custom discrete colors to override theme colors */
  colors?: string[];
  /** Standard formatting function for numerical labels */
  valueFormatter?: (value: number) => string;
  /** Number of grid columns spanned on desktop layouts */
  widthColumns?: number;
  /** Alias for widthColumns */
  column?: number;
  /** Number of grid rows spanned on desktop layouts */
  heightRows?: number;
  /** Enable formatting value aggregates as percentages */
  asPercentage?: boolean;
  /** Override theme setting for this chart specifically */
  theme?: ChartTheme;
}

/**
 * Filter interaction query definition.
 */
export interface Filter {
  /** The dimension field name being filtered */
  field: string;
  /** The selected category value of the filter */
  value: any;
}
