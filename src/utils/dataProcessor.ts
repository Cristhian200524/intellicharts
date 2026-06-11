import { ChartConfig } from '../chart/types';

export interface AggregatedData {
  categories: string[];
  values: number[];
  othersDetails: { category: string; value: number }[];
  rawTotal: number;
}

/**
 * Aggregates dataset records by category/dimension, applying groupings and percentage conversions.
 *
 * @param data Array of raw dataset records.
 * @param config Chart dimensions and configurations.
 * @param limitCategories Maximum categories allowed before grouping remaining into "Others".
 * @returns The aggregated dataset categories, values, and grouped "Others" details.
 */
export function aggregateChartData(
  data: any[],
  config: ChartConfig,
  limitCategories?: number
): AggregatedData {
  const aggregated = new Map<string, number>();
  for (const row of data) {
    const dimValue = String(row[config.dimension]);
    const measureValue = Number(row[config.measure]);
    if (dimValue && !isNaN(measureValue)) {
      aggregated.set(dimValue, (aggregated.get(dimValue) || 0) + measureValue);
    }
  }

  let othersDetails: { category: string; value: number }[] = [];
  let categories: string[] = [];
  let values: number[] = [];

  const limit = limitCategories;
  if (limit && limit > 0 && aggregated.size > limit) {
    const sorted = Array.from(aggregated.entries()).sort((a, b) => b[1] - a[1]);
    const topItems = sorted.slice(0, limit - 1);
    const remainingItems = sorted.slice(limit - 1);
    
    const othersSum = remainingItems.reduce((sum, item) => sum + item[1], 0);
    othersDetails = remainingItems.map(([category, value]) => ({ category, value }));
    
    categories = [...topItems.map(([cat]) => cat), 'Others'];
    values = [...topItems.map(([, val]) => val), othersSum];
  } else {
    categories = Array.from(aggregated.keys());
    values = Array.from(aggregated.values());
  }

  const rawTotal = values.reduce((sum, val) => sum + val, 0);

  if (config.asPercentage) {
    const total = values.reduce((sum, val) => sum + val, 0);
    if (total !== 0) {
      values = values.map(val => Number(((val / total) * 100).toFixed(2)));
    }
  }

  return {
    categories,
    values,
    othersDetails,
    rawTotal
  };
}
