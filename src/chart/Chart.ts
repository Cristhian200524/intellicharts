import * as echarts from 'echarts';
import { ChartTheme, THEMES } from '../theme';
import { parseCSV } from '../csv';
import { ChartConfig, Filter } from './types';
import { buildEChartsOption } from './options';

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
  /** ResizeObserver instance for handling container resizing */
  private resizeObserver?: ResizeObserver;

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
   * Sets and applies a visual theme to this chart, updating its container and redrawing it.
   */
  public setTheme(theme: ChartTheme) {
    this.setResolvedTheme(theme);
    this.applyContainerTheme(theme);
    if (this.lastData.length > 0) {
      this.render(this.lastData);
    }
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
    this.container.style.color = styles.textColor;
    if (styles.fontFamily) {
      this.container.style.fontFamily = styles.fontFamily;
    }

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

      this.resizeObserver = new ResizeObserver(() => {
        this.instance?.resize();
        // Dynamic re-render to recalculate ECharts dynamic title widths
        if (this.lastData.length > 0) {
          this.render(this.lastData);
        }
      });
      this.resizeObserver.observe(container);
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
   * Returns the DOM container element.
   */
  public getContainer(): HTMLElement | undefined {
    return this.container;
  }

  /**
   * Cleans up the chart by disposing of the ECharts instance and clearing listeners.
   */
  public dispose() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    if (this.instance) {
      this.instance.dispose();
      this.instance = undefined;
    }
    if (this.container) {
      this.container.onmouseenter = null;
      this.container.onmouseleave = null;
    }
  }

  /**
   * Visual render updating aggregations and binding ECharts options.
   * Supports visual cross-highlighting of active selections (v1.0.1).
   */
  public render(data: any[] | string, activeFilters: Filter[] = []) {
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
      const cardFont = (t.fontFamily ?? 'sans-serif').replace(/"/g, "'");

      let titleEl = this.container.querySelector('.card-title') as HTMLElement;
      let valueEl = this.container.querySelector('.card-value') as HTMLElement;

      if (!titleEl || !valueEl) {
        this.container.innerHTML = `
          <div class="card-title" style="font-size: clamp(0.85rem, 2.5vw, 1.05rem); font-weight: 600; color: ${t.cardTitleColor}; font-family: ${cardFont}; margin-bottom: 8px; text-align: center; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.95; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
            ${this.config.title || ''}
          </div>
          <div class="card-value" style="font-size: clamp(1.8rem, 5vw, 3.2rem); font-weight: 800; color: ${valueColor}; font-family: ${cardFont}; text-align: center; text-shadow: ${theme === '3D' ? '1px 1px 0px #fff, 2px 2px 0px rgba(0,0,0,0.1)' : 'none'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; transition: opacity 0.3s ease, transform 0.3s ease, color 0.3s ease;">
            ${displayValue}
          </div>
        `;
      } else {
        titleEl.style.fontFamily = cardFont;
        titleEl.style.color = t.cardTitleColor;
        valueEl.style.fontFamily = cardFont;
        valueEl.style.textShadow = theme === '3D' ? '1px 1px 0px #fff, 2px 2px 0px rgba(0,0,0,0.1)' : 'none';

        valueEl.style.opacity = '0.2';
        valueEl.style.transform = 'scale(0.95)';
        setTimeout(() => {
          valueEl.innerText = displayValue;
          valueEl.style.color = valueColor;
          valueEl.style.opacity = '1';
          valueEl.style.transform = 'scale(1)';
        }, 150);
      }
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

    const containerWidth = this.container ? this.container.clientWidth : 180;
    const option = buildEChartsOption(this.config, theme, activeFilters, categories, values, containerWidth);

    this.instance.setOption(option, true);
  }
}
