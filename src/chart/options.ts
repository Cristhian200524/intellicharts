import * as echarts from 'echarts';
import { ChartConfig, Filter } from './types';
import { ChartTheme, THEMES } from '../theme';

/**
 * Builds the EChartsOption configuration object based on the chart settings,
 * the active theme, filters, and aggregated categories and values.
 */
export function buildEChartsOption(
  config: ChartConfig,
  theme: ChartTheme,
  activeFilters: Filter[],
  categories: string[],
  values: number[],
  containerWidth: number
): echarts.EChartsOption {
  const t = THEMES[theme];
  const chartFilter = activeFilters.find(f => f.field === config.dimension);

  let option: echarts.EChartsOption = {};
  const tooltipFormatter = config.asPercentage ? '{b}: {c}%' : undefined;
  const yAxisLabel = config.asPercentage ? { formatter: '{value}%' } : undefined;

  if (config.type === 'bar') {
    option = {
      title: { text: config.title },
      tooltip: config.asPercentage ? { formatter: tooltipFormatter } : {},
      xAxis: { type: 'category', data: categories },
      yAxis: { type: 'value', axisLabel: yAxisLabel },
      series: [{
        type: 'bar',
        data: categories.map((cat, i) => {
          const isSelected = !chartFilter || String(cat) === String(chartFilter.value);
          return {
            value: values[i],
            itemStyle: {
              opacity: isSelected ? 1 : 0.25
            }
          };
        }),
        colorBy: 'data'
      }]
    };
  } else if (config.type === 'line') {
    option = {
      title: { text: config.title },
      tooltip: config.asPercentage ? { formatter: tooltipFormatter } : {},
      xAxis: { type: 'category', data: categories },
      yAxis: { type: 'value', axisLabel: yAxisLabel },
      series: [{
        type: 'line',
        data: categories.map((cat, i) => {
          const isSelected = !chartFilter || String(cat) === String(chartFilter.value);
          return {
            value: values[i],
            symbolSize: isSelected ? 8 : 4,
            itemStyle: {
              opacity: isSelected ? 1 : 0.25
            }
          };
        })
      }]
    };
  } else if (config.type === 'pie') {
    option = {
      title: { text: config.title },
      tooltip: { trigger: 'item', formatter: config.asPercentage ? tooltipFormatter : undefined },
      series: [{
        type: 'pie',
        data: categories.map((cat, i) => {
          const isSelected = !chartFilter || String(cat) === String(chartFilter.value);
          return {
            name: cat,
            value: values[i],
            itemStyle: {
              opacity: isSelected ? 1 : 0.25
            }
          };
        })
      }]
    };
  } else if (config.type === 'donut') {
    option = {
      title: { text: config.title },
      tooltip: { trigger: 'item', formatter: config.asPercentage ? tooltipFormatter : undefined },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: categories.map((cat, i) => {
          const isSelected = !chartFilter || String(cat) === String(chartFilter.value);
          return {
            name: cat,
            value: values[i],
            itemStyle: {
              opacity: isSelected ? 1 : 0.25
            }
          };
        })
      }]
    };
  } else if (config.type === 'radar') {
    const maxVal = Math.max(...values, 0);
    option = {
      title: { text: config.title },
      tooltip: {},
      radar: {
        indicator: categories.map(cat => ({ name: cat, max: maxVal * 1.1 || 100 }))
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: config.title || 'Data'
        }]
      }]
    };
  } else if (config.type === 'funnel') {
    option = {
      title: { text: config.title },
      tooltip: { trigger: 'item', formatter: config.asPercentage ? tooltipFormatter : undefined },
      series: [{
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 20,
        width: '80%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: config.asPercentage ? '{b}: {c}%' : '{b}: {c}',
          fontFamily: t.fontFamily ?? 'sans-serif'
        },
        labelLine: {
          show: false
        },
        data: categories.map((cat, i) => {
          const isSelected = !chartFilter || String(cat) === String(chartFilter.value);
          return {
            name: cat,
            value: values[i],
            itemStyle: {
              opacity: isSelected ? 1 : 0.25
            }
          };
        })
      }]
    };
  }

  option.color = config.colors ?? t.echartsColors;

  // Calculate dynamic available title width to trigger truncation accurately
  const availableWidth = containerWidth - 45;

  if (option.title) {
    const titleObj = option.title as any;
    titleObj.textStyle = {
      color: t.textColor,
      fontFamily: t.fontFamily ?? 'sans-serif',
      fontSize: 14,
      fontWeight: '600',
      width: availableWidth,
      overflow: 'truncate',
      ellipsis: '...',
      ...titleObj.textStyle
    };
  }

  if (option.legend) {
    const legendObj = option.legend as any;
    legendObj.textStyle = {
      color: t.textColor,
      fontFamily: t.fontFamily ?? 'sans-serif',
      ...legendObj.textStyle
    };
  }

  if (option.tooltip) {
    const tooltipObj = option.tooltip as any;
    tooltipObj.backgroundColor = t.tooltipBg;
    tooltipObj.borderColor = t.tooltipBorderColor;
    tooltipObj.borderWidth = 1;
    tooltipObj.textStyle = {
      color: t.tooltipTextColor,
      fontFamily: t.fontFamily ?? 'sans-serif',
      fontSize: 12,
      ...tooltipObj.textStyle
    };
  }

  option.grid = {
    top: 60,
    right: 15,
    bottom: 25,
    left: 15,
    containLabel: true,
    ...option.grid
  };

  if (option.xAxis) {
    const xAxisObj = option.xAxis as any;
    xAxisObj.axisLabel = {
      color: t.textColor,
      fontFamily: t.fontFamily ?? 'sans-serif',
      fontSize: 10,
      ...xAxisObj.axisLabel
    };
    xAxisObj.axisLine = {
      lineStyle: {
        color: t.axisLineColor
      },
      ...xAxisObj.axisLine
    };
    xAxisObj.splitLine = {
      show: false
    };
  }

  if (option.yAxis) {
    const yAxisObj = option.yAxis as any;
    yAxisObj.axisLabel = {
      color: t.textColor,
      fontFamily: t.fontFamily ?? 'sans-serif',
      fontSize: 10,
      ...yAxisObj.axisLabel
    };
    yAxisObj.axisLine = {
      lineStyle: {
        color: t.axisLineColor
      },
      ...yAxisObj.axisLine
    };
    yAxisObj.splitLine = {
      lineStyle: {
        color: t.gridLineColor,
        type: t.gridLineType
      },
      ...yAxisObj.splitLine
    };
  }

  if (option.radar) {
    const radarObj = option.radar as any;
    radarObj.axisName = {
      color: t.textColor,
      fontFamily: t.fontFamily ?? 'sans-serif',
      fontSize: 10,
      ...radarObj.axisName
    };
    radarObj.splitLine = {
      lineStyle: {
        color: t.gridLineColor,
        type: t.gridLineType
      },
      ...radarObj.splitLine
    };
    radarObj.splitArea = {
      show: theme !== 'minimal',
      areaStyle: {
        color: theme === 'modern' || theme === 'glass'
          ? ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)']
          : ['rgba(0,0,0,0.01)', 'rgba(0,0,0,0.03)']
      },
      ...radarObj.splitArea
    };
  }

  if (option.series && Array.isArray(option.series)) {
    option.series = option.series.map((s: any) => {
      if (s.type === 'bar') {
        return {
          ...s,
          itemStyle: {
            ...t.extraBarItemStyle,
            ...s.itemStyle
          }
        };
      } else if (s.type === 'line') {
        return {
          ...s,
          ...t.extraLineSymbolStyle,
          lineStyle: {
            ...t.extraLineStyle,
            ...s.lineStyle
          },
          areaStyle: s.areaStyle ?? t.extraAreaStyle
        };
      } else if (s.type === 'radar') {
        return {
          ...s,
          data: s.data.map((item: any) => ({
            ...item,
            ...t.extraRadarStyle
          }))
        };
      } else if (s.type === 'pie' || s.type === 'funnel') {
        const useStyling = theme === 'modern' || theme === 'glass' || theme === 'elegant';
        const extraStyle = s.type === 'pie' ? t.extraPieItemStyle : t.extraFunnelItemStyle;
        return {
          ...s,
          itemStyle: {
            borderRadius: useStyling ? 6 : 0,
            borderColor: theme === 'modern'
              ? '#151528'
              : (theme === 'glass'
                ? 'rgba(255, 255, 255, 0.15)'
                : (theme === 'elegant' ? '#060b13' : 'none')),
            borderWidth: useStyling ? 2 : 0,
            ...extraStyle,
            ...s.itemStyle
          }
        };
      }
      return s;
    });
  }

  option.animation = true;
  option.animationDuration = 400;
  option.animationDurationUpdate = 400;
  option.animationEasing = 'cubicOut';
  option.animationEasingUpdate = 'cubicOut';

  return option;
}
