import { ChartTheme } from '../theme';

/**
 * Configuration options for the Dashboard layout engine.
 */
export interface DashboardConfig {
  /** Maximum number of grid columns on desktop layouts */
  columns?: number;
  /** Gap space between grid items (e.g., '20px') */
  gap?: string;
  /** Base height spanned by a single grid row */
  rowHeight?: string;
  /** Default visual theme applied to children charts */
  theme?: ChartTheme;
  /** Limit the number of categories rendered by default on all dashboard charts */
  limitCategories?: number;
  /** Whether to show the global active filters toolbar (default: true) */
  showFilterToolbar?: boolean;
}
