import { ChartConfig, Filter } from '../types';
import { ChartTheme, ThemeStyles } from '../../theme';
import { isDarkColor } from './canvasUtils';

/** Themes that render pie/donut and funnel segments with rounded corners. */
export function isRoundedTheme(theme: ChartTheme): boolean {
  return theme === 'elegant' || theme === '3D' || theme === 'glass' || theme === 'modern';
}

/** Themes that apply destination-out stroke gaps between pie/funnel segments. */
export function isStyledTheme(theme: ChartTheme): boolean {
  return theme === 'modern' || theme === 'glass' || theme === 'elegant' || theme === '3D' || theme === 'neon';
}

/**
 * Computes interpolated opacity for a data item based on filter state,
 * animation progress, and hover.
 */
export function computeItemOpacity(
  category: string,
  dimension: string,
  activeFilter: Filter | undefined,
  prevFilters: Filter[],
  hoveredIndex: number | null,
  index: number,
  animationProgress: number
): number {
  const prevFilter = prevFilters.find(f => f.field === dimension);
  const wasSelected = !prevFilter || String(category) === String(prevFilter.value);
  const isSelected = !activeFilter || String(category) === String(activeFilter.value);
  const isHovered = hoveredIndex === index;

  const startOpacity = wasSelected ? 1.0 : 0.25;
  const endOpacity = isSelected ? 1.0 : 0.25;
  let opacity = startOpacity + (endOpacity - startOpacity) * animationProgress;

  if (isHovered) {
    opacity = Math.min(1.0, opacity + 0.15);
  }
  return opacity;
}

/** Returns the color definition (string or gradient object) for a data index. */
export function getColorDef(index: number, config: ChartConfig, styles: ThemeStyles): any {
  const colorIndex = index % (config.colors?.length || styles.chartColors.length);
  return config.colors ? config.colors[colorIndex] : styles.chartColors[colorIndex];
}

/** Extracts a flat color string from a color definition (string or gradient). */
export function resolveColorString(colorDef: any): string {
  if (typeof colorDef === 'string') return colorDef;
  if (colorDef?.colorStops?.[0]) return colorDef.colorStops[0].color;
  return '#ccc';
}

/** Returns the appropriate text color for labels rendered inside filled chart shapes. */
export function getItemTextColor(theme: ChartTheme, colorDef: any): string {
  if (theme === 'sketch') return '#2b2b2b';
  if (theme === 'elegant') return '#f3e7c4';
  if (theme === 'glass') return '#ffffff';
  return isDarkColor(colorDef) ? '#ffffff' : '#242424';
}
