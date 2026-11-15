import { ChartTheme } from '../themes/themes';

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
  /** Limit the number of categories rendered, grouping remaining into 'Others' */
  limitCategories?: number;
  /** Custom center [x, y] in px or percentage for pie, donut, and radar charts */
  center?: [number | string, number | string];
  /** Custom radius or [innerRadius, outerRadius] in px or percentage for pie, donut, and radar charts */
  radius?: number | string | [number | string, number | string];
  /** Prevent radial labels from overlapping each other or the title in pie and donut charts */
  avoidLabelOverlap?: boolean;
  /** Custom formatter function for category labels */
  labelFormatter?: (category: string) => string;
  /** Whether to render category/data labels on the chart (default: true) */
  showLabels?: boolean;
  /** Custom plot area padding overrides in pixels */
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
  /** Base font size in pixels for axis and data labels (default: 10) */
  fontSize?: number;
  /** Font size in pixels for the chart title (default: 14) */
  titleFontSize?: number;
  /** Enable smooth Bezier curve rendering on line charts */
  smooth?: boolean;
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
