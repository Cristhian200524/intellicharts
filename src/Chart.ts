import * as echarts from 'echarts';
import { ChartTheme, THEMES } from './theme';
import { parseCSV } from './csv';

/**
 * Configuration options for a single Chart instance.
 */
export interface ChartConfig {
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

/**
 * Represents a single chart widget within the dashboard wrapper.
 */
export class Chart {
  /** The ECharts instance wrapper for canvas rendering */
  private instance?: echarts.ECharts;
  /** Local configuration options passed in constructor */
  private config: ChartConfig;
  /** Callback triggered when a data point is clicked */
  private filterCallback?: (filter: Filter) => void;
  /** Column span in the dashboard grid layout */
  public widthColumns: number;
  /** Row span in the dashboard grid layout */
  public heightRows: number;
  /** Cache of the last rendered dataset for resize and theme redraws */
  private lastData: any[] = [];
  /** The DOM container element the widget is mounted in */
  private container?: HTMLElement;
  /** Theme resolved by parent propagation or local config */
  private resolvedTheme?: ChartTheme;

  constructor(config: ChartConfig) {
    this.config = config;
    this.widthColumns = config.column ?? config.widthColumns ?? 1;
    this.heightRows = config.heightRows ?? 1;
  }

  /**
   * Sets the visual theme value computed by the dashboard parent.
   */
  public setResolvedTheme(theme: ChartTheme) {
    this.resolvedTheme = theme;
  }

  /**
   * Resolves the theme to render, giving priority to local config.
   */
  public getResolvedTheme(): ChartTheme {
    return this.resolvedTheme ?? this.config.theme ?? 'common';
  }

  /**
   * Returns the chart config.
   */
  public getConfig(): ChartConfig {
    return this.config;
  }

  /**
   * Applies the background, border, shadow, and backdrop filters of the theme.
   */
  public applyContainerTheme(theme: ChartTheme) {
    if (!this.container) return;
    const styles = THEMES[theme];

    this.container.style.background = styles.containerBackground;
    this.container.style.border = styles.containerBorder;
    this.container.style.borderRadius = styles.containerBorderRadius;
    this.container.style.boxShadow = styles.containerBoxShadow;
    this.container.style.transition = styles.containerTransition;

    if (styles.containerBackdropFilter) {
      this.container.style.backdropFilter = styles.containerBackdropFilter;
      (this.container.style as any).webkitBackdropFilter = styles.containerBackdropFilter;
    } else {
      this.container.style.backdropFilter = 'none';
      (this.container.style as any).webkitBackdropFilter = 'none';
    }

    this.container.onmouseenter = () => {
      if (styles.containerHoverBoxShadow) {
        this.container!.style.boxShadow = styles.containerHoverBoxShadow;
      }
      if (styles.containerHoverTransform) {
        this.container!.style.transform = styles.containerHoverTransform;
      }
      if (styles.containerHoverBorder) {
        this.container!.style.border = styles.containerHoverBorder;
      }
    };

    this.container.onmouseleave = () => {
      this.container!.style.boxShadow = styles.containerBoxShadow;
      this.container!.style.transform = 'none';
      this.container!.style.border = styles.containerBorder;
    };
  }

  /**
   * Initial setup rendering core DOM layouts and registering click nodes.
   */
  public mount(container: HTMLElement) {
    this.container = container;

    const theme = this.getResolvedTheme();
    this.applyContainerTheme(theme);

    if (this.config.type === 'card') {
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'column';
      this.container.style.justifyContent = 'center';
      this.container.style.alignItems = 'center';
    } else {
      if (this.instance) {
        this.instance.dispose();
      }
      this.instance = echarts.init(container);

      this.instance.on('click', (params) => {
        if (this.filterCallback && params.name) {
          this.filterCallback({
            field: this.config.dimension,
            value: params.name
          });
        }
      });

      const observer = new ResizeObserver(() => {
        this.instance?.resize();
        // Dynamic re-render to recalculate ECharts dynamic title widths
        if (this.lastData.length > 0) {
          this.render(this.lastData);
        }
      });
      observer.observe(container);
    }

    if (this.lastData.length > 0) {
      this.render(this.lastData);
    }
  }

  /**
   * Returns the config dimension key.
   */
  public getDimension(): string {
    return this.config.dimension;
  }

  /**
   * Returns the type identifier.
   */
  public getType(): string {
    return this.config.type;
  }

  /**
   * Registers filtering callback triggers.
   */
  public onFilter(cb: (filter: Filter) => void) {
    this.filterCallback = cb;
  }

  /**
   * Visual render updating aggregations and binding ECharts options.
   */
  public render(data: any[] | string) {
    const parsedData = typeof data === 'string' ? parseCSV(data) : data;
    this.lastData = parsedData;
    data = parsedData;
    const theme = this.getResolvedTheme();
    const t = THEMES[theme];

    if (this.config.type === 'card') {
      if (!this.container) return;
      const values = this.lastData.map(row => Number(row[this.config.measure])).filter(v => !isNaN(v));
      const totalValue = values.reduce((sum, val) => sum + val, 0);
      const displayValue = this.config.valueFormatter ? this.config.valueFormatter(totalValue) : String(totalValue);
      const valueColor = this.config.colors ? this.config.colors[0] : t.cardValueColor;

      this.container.innerHTML = `
        <div class="card-title" style="font-size: clamp(0.85rem, 2.5vw, 1.05rem); font-weight: 600; color: ${t.cardTitleColor}; font-family: ${t.cardFontFamily ?? 'sans-serif'}; margin-bottom: 8px; text-align: center; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.95; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
          ${this.config.title || ''}
        </div>
        <div class="card-value" style="font-size: clamp(1.8rem, 5vw, 3.2rem); font-weight: 800; color: ${valueColor}; font-family: ${t.cardFontFamily ?? 'sans-serif'}; text-align: center; text-shadow: ${theme === '3D' ? '1px 1px 0px #fff, 2px 2px 0px rgba(0,0,0,0.1)' : 'none'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; transition: all 0.3s ease;">
          ${displayValue}
        </div>
      `;
      return;
    }

    if (!this.instance) return;

    const aggregated = new Map<string, number>();
    for (const row of data) {
      const dimValue = String(row[this.config.dimension]);
      const measureValue = Number(row[this.config.measure]);
      if (dimValue && !isNaN(measureValue)) {
        aggregated.set(dimValue, (aggregated.get(dimValue) || 0) + measureValue);
      }
    }

    let categories = Array.from(aggregated.keys());
    let values = Array.from(aggregated.values());

    if (this.config.asPercentage) {
      const total = values.reduce((sum, val) => sum + val, 0);
      if (total !== 0) {
        values = values.map(val => Number(((val / total) * 100).toFixed(2)));
      }
    }

    let option: echarts.EChartsOption = {};
    const tooltipFormatter = this.config.asPercentage ? '{b}: {c}%' : undefined;
    const yAxisLabel = this.config.asPercentage ? { formatter: '{value}%' } : undefined;

    if (this.config.type === 'bar') {
      option = {
        title: { text: this.config.title },
        tooltip: this.config.asPercentage ? { formatter: tooltipFormatter } : {},
        xAxis: { type: 'category', data: categories },
        yAxis: { type: 'value', axisLabel: yAxisLabel },
        series: [{ type: 'bar', data: values, colorBy: 'data' }]
      };
    } else if (this.config.type === 'line') {
      option = {
        title: { text: this.config.title },
        tooltip: this.config.asPercentage ? { formatter: tooltipFormatter } : {},
        xAxis: { type: 'category', data: categories },
        yAxis: { type: 'value', axisLabel: yAxisLabel },
        series: [{ type: 'line', data: values }]
      };
    } else if (this.config.type === 'pie') {
      option = {
        title: { text: this.config.title },
        tooltip: { trigger: 'item', formatter: this.config.asPercentage ? tooltipFormatter : undefined },
        series: [{
          type: 'pie',
          data: categories.map((cat, i) => ({ name: cat, value: values[i] }))
        }]
      };
    } else if (this.config.type === 'donut') {
      option = {
        title: { text: this.config.title },
        tooltip: { trigger: 'item', formatter: this.config.asPercentage ? tooltipFormatter : undefined },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: categories.map((cat, i) => ({ name: cat, value: values[i] }))
        }]
      };
    } else if (this.config.type === 'radar') {
      const maxVal = Math.max(...values, 0);
      option = {
        title: { text: this.config.title },
        tooltip: {},
        radar: {
          indicator: categories.map(cat => ({ name: cat, max: maxVal * 1.1 || 100 }))
        },
        series: [{
          type: 'radar',
          data: [{
            value: values,
            name: this.config.title || 'Data'
          }]
        }]
      };
    } else if (this.config.type === 'funnel') {
      option = {
        title: { text: this.config.title },
        tooltip: { trigger: 'item', formatter: this.config.asPercentage ? tooltipFormatter : undefined },
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
            formatter: this.config.asPercentage ? '{b}: {c}%' : '{b}: {c}',
            fontFamily: t.fontFamily ?? 'sans-serif'
          },
          labelLine: {
            show: false
          },
          data: categories.map((cat, i) => ({ name: cat, value: values[i] }))
        }]
      };
    }

    option.color = this.config.colors ?? t.echartsColors;

    // Calculate dynamic available title width to trigger truncation accurately
    const availableWidth = this.container ? (this.container.clientWidth - 45) : 180;

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
            lineStyle: {
              ...t.extraLineStyle,
              ...s.lineStyle
            },
            areaStyle: s.areaStyle ?? t.extraAreaStyle
          };
        } else if (s.type === 'pie' || s.type === 'funnel') {
          const useStyling = theme === 'modern' || theme === 'glass' || theme === 'elegant';
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
              ...s.itemStyle
            }
          };
        }
        return s;
      });
    }

    this.instance.setOption(option, true);
  }
}
