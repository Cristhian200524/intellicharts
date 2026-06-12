import { ThemeStyles } from '../themes/themes';
import { ChartConfig } from '../chart/types';

/**
 * Generates the HTML breakdown list for the grouped categories inside the "Others" category tooltip.
 *
 * @param othersDetails Sorted list of items grouped inside the Others category.
 * @param rawTotal Sum of all chart values for percentage calculations.
 * @param theme The current resolved chart theme name.
 * @param styles The styling definition dictionary for the theme.
 * @param config Chart dimensions and configurations.
 * @returns The HTML markup string representing the breakdown list.
 */
export function getOthersBreakdownHTML(
  othersDetails: { category: string; value: number }[],
  rawTotal: number,
  theme: string,
  styles: ThemeStyles,
  config: ChartConfig
): string {
  const isDark = ['modern', 'glass', 'elegant', 'neon'].includes(theme);
  const grayColor = isDark ? '#94a3b8' : '#64748b';
  const valColor = isDark ? '#f1f5f9' : '#1e293b';
  const dividerColor = styles.tooltipBorderColor || (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)');

  let breakdown = `<div style="font-size: 11px; margin-top: 6px; border-top: 1px solid ${dividerColor}; padding-top: 6px; color: ${grayColor};">`;
  othersDetails.forEach((item) => {
    const itemValFormatted = config.valueFormatter ? config.valueFormatter(item.value) : item.value.toLocaleString();
    let itemText = itemValFormatted;
    if (config.asPercentage) {
      const pct = rawTotal > 0 ? (item.value / rawTotal) * 100 : 0;
      itemText += ` (${pct.toFixed(2)}%)`;
    }
    breakdown += `<div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 3px; align-items: center;">
      <span>${item.category}</span>
      <span style="font-weight: 600; color: ${valColor};">${itemText}</span>
    </div>`;
  });
  breakdown += `</div>`;
  return breakdown;
}
