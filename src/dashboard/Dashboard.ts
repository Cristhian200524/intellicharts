import { Chart } from '../chart/Chart';
import { Filter } from '../chart/types';
import { ChartTheme, THEMES } from '../theme';
import { parseCSV } from '../csv';
import { injectGoogleFonts } from '../fonts';
import { autogenerate, DataType } from '../autogenerate';
import { DashboardConfig } from './types';

/**
 * The Dashboard manages multiple charts in a dynamic responsive CSS Grid.
 */
export class Dashboard {
  /** The parent DOM grid container wrapper */
  private container: HTMLElement;
  /** Configuration options for layout and global theme */
  private config: DashboardConfig;
  /** Array of registered child chart widgets */
  private charts: Chart[] = [];
  /** Cache of the global raw dataset */
  private data: any[] = [];
  /** Array of currently active global dimension filters */
  private activeFilters: Filter[] = [];
  /** ResizeObserver instance for handling container resizing */
  private resizeObserver?: ResizeObserver;
  /** Element reference for the global active filters toolbar */
  private toolbarEl?: HTMLElement;

  /**
   * Automatically creates, structures, and mounts a populated dashboard container.
   *
   * @param container The parent DOM element to render the Dashboard into.
   * @param data Array of records or a raw CSV string.
   * @param schema Optional schema overrides to explicitly specify DataTypes for columns.
   * @param config Optional Dashboard layout and theme configurations.
   * @returns Instantiated and fully rendered Dashboard wrapper.
   */
  public static autogenerate(
    container: HTMLElement,
    data: any[] | string,
    schema?: Record<string, DataType>,
    config?: DashboardConfig
  ): Dashboard {
    return autogenerate(container, data, schema, config);
  }

  constructor(container: HTMLElement, config?: DashboardConfig) {
    injectGoogleFonts();
    this.container = container;
    this.config = { columns: 3, gap: '20px', rowHeight: '300px', theme: 'common', showFilterToolbar: true, ...config };

    this.container.style.display = 'grid';
    this.container.style.gridTemplateColumns = `repeat(${this.config.columns}, 1fr)`;
    this.container.style.gap = this.config.gap!;
    this.applyDashboardTheme(this.config.theme ?? 'common');

    this.resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width < 576) {
          this.container.style.gridTemplateColumns = '1fr';
          this.charts.forEach(chart => {
            const child = chart.getContainer();
            if (child) child.style.gridColumn = 'span 1';
          });
        } else if (width < 992 && this.config.columns! > 2) {
          const tabletCols = Math.min(2, this.config.columns!);
          this.container.style.gridTemplateColumns = `repeat(${tabletCols}, 1fr)`;
          this.charts.forEach(chart => {
            const child = chart.getContainer();
            if (child) child.style.gridColumn = `span 1`;
          });
        } else {
          this.container.style.gridTemplateColumns = `repeat(${this.config.columns}, 1fr)`;
          this.charts.forEach(chart => {
            const child = chart.getContainer();
            if (child) {
              child.style.gridColumn = `span ${Math.min(chart.widthColumns, this.config.columns!)}`;
            }
          });
        }
      }
    });
    this.resizeObserver.observe(this.container);
  }

  /**
   * Returns the dashboard layout and theme configuration.
   *
   * @returns DashboardConfig settings.
   */
  public getConfig(): DashboardConfig {
    return this.config;
  }

  /**
   * Returns the active raw dataset loaded in the dashboard.
   */
  public getData(): any[] {
    return this.data;
  }

  /**
   * Updates the source dataset and triggers updates on all child charts.
   */
  public setData(data: any[] | string) {
    if (typeof data === 'string') {
      this.data = parseCSV(data);
    } else {
      this.data = data;
    }
    this.updateAllCharts();
  }

  /**
   * Dynamic theme updates across all inheriting dashboard charts.
   */
  public setTheme(theme: ChartTheme) {
    this.config.theme = theme;
    this.applyDashboardTheme(theme);
    this.renderToolbar();
    this.charts.forEach(chart => {
      chart.setDashboardTheme(theme);

      if (chart.getConfig().theme !== undefined) {
        chart.applyContainerTheme(chart.getConfig().theme!);
        return;
      }

      chart.setResolvedTheme(theme);
      chart.applyContainerTheme(theme);
      if (this.data.length > 0) {
        chart.render(this.getFilteredDataForChart(chart), this.activeFilters);
      }
    });
  }

  /**
   * Appends and mounts a chart into the responsive dashboard grid.
   */
  public addChart(chart: Chart) {
    const chartContainer = document.createElement('div');
    chartContainer.style.padding = '18px';
    chartContainer.style.boxSizing = 'border-box';
    chartContainer.style.height = `calc(${this.config.rowHeight} * ${chart.heightRows} + ${this.config.gap} * (${chart.heightRows} - 1))`;
    chartContainer.style.gridColumn = `span ${Math.min(chart.widthColumns, this.config.columns!)}`;
    chartContainer.style.gridRow = `span ${chart.heightRows}`;
    chartContainer.style.overflow = 'hidden';
    chartContainer.style.position = 'relative';

    this.container.appendChild(chartContainer);
    this.charts.push(chart);

    chart.setDashboardTheme(this.config.theme);

    const resolvedTheme = chart.getConfig().theme ?? this.config.theme ?? 'common';
    chart.setResolvedTheme(resolvedTheme);

    const resolvedLimit = chart.getConfig().limitCategories ?? this.config.limitCategories;
    chart.setResolvedLimitCategories(resolvedLimit);

    chart.mount(chartContainer);

    chart.onFilter((filter: Filter) => {
      this.toggleFilter(filter);
    });
    
    if (this.data.length > 0) {
      chart.render(this.getFilteredDataForChart(chart), this.activeFilters);
    }
  }

  private toggleFilter(filter: Filter) {
    const index = this.activeFilters.findIndex(f => {
      if (f.field !== filter.field) return false;
      if (Array.isArray(f.value) && Array.isArray(filter.value)) {
        return f.value.length === filter.value.length && f.value.every((v, i) => v === filter.value[i]);
      }
      return f.value === filter.value;
    });
    if (index >= 0) {
      this.activeFilters.splice(index, 1);
    } else {
      const fieldIndex = this.activeFilters.findIndex(f => f.field === filter.field);
      if (fieldIndex >= 0) {
        this.activeFilters[fieldIndex].value = filter.value;
      } else {
        this.activeFilters.push(filter);
      }
    }
    this.updateAllCharts();
  }

  /**
   * Explicitly sets a global dimension filter and triggers a re-render of all dashboard charts.
   *
   * @param field The dimension column key to filter.
   * @param value The value to apply to the filter.
   */
  public setFilter(field: string, value: any): void {
    const index = this.activeFilters.findIndex(f => f.field === field);
    if (index >= 0) {
      this.activeFilters[index].value = value;
    } else {
      this.activeFilters.push({ field, value });
    }
    this.updateAllCharts();
  }

  /**
   * Explicitly removes a global dimension filter and triggers a re-render of all dashboard charts.
   *
   * @param field The dimension column key to remove filtering from.
   */
  public removeFilter(field: string): void {
    const index = this.activeFilters.findIndex(f => f.field === field);
    if (index >= 0) {
      this.activeFilters.splice(index, 1);
      this.updateAllCharts();
    }
  }

  private updateAllCharts() {
    this.renderToolbar();
    this.charts.forEach(chart => {
      chart.render(this.getFilteredDataForChart(chart), this.activeFilters);
    });
  }

  private getFilteredDataForChart(chart: Chart): any[] {
    const chartDimension = chart.getDimension();
    const chartType = chart.getType();
    
    return this.data.filter(row => {
      for (const filter of this.activeFilters) {
        if (chartType === 'card' || filter.field !== chartDimension) {
          if (Array.isArray(filter.value)) {
            if (!filter.value.map(String).includes(String(row[filter.field]))) {
              return false;
            }
          } else {
            if (String(row[filter.field]) !== String(filter.value)) {
              return false;
            }
          }
        }
      }
      return true;
    });
  }

  private applyDashboardTheme(theme: ChartTheme) {
    const styles = THEMES[theme];
    if (styles) {
      this.container.style.background = styles.dashboardBackground ?? 'transparent';
      this.container.style.color = styles.dashboardTextColor ?? 'inherit';
      this.container.style.padding = '20px';
      this.container.style.borderRadius = '16px';
      this.container.style.transition = 'all 0.4s ease';
    }
  }

  /**
   * Removes a single chart from the dashboard, cleaning up its DOM element and canvas resources.
   */
  public removeChart(chart: Chart) {
    const index = this.charts.indexOf(chart);
    if (index >= 0) {
      this.charts.splice(index, 1);
      const chartContainer = chart.getContainer();
      if (chartContainer && this.container.contains(chartContainer)) {
        this.container.removeChild(chartContainer);
      }
      chart.dispose();
    }
  }

  /**
   * Removes all registered charts from the dashboard and clears the layout container.
   */
  public removeAllCharts() {
    const chartsCopy = [...this.charts];
    chartsCopy.forEach(chart => this.removeChart(chart));
    this.charts = [];
    this.container.innerHTML = '';
    this.toolbarEl = undefined;
  }

  /**
   * Cleans up the dashboard by disposing of all child charts, disconnecting resize observers, and clearing listeners.
   */
  public dispose() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    this.removeAllCharts();
  }

  /**
   * Clears all active global cross-filtering selections and updates all charts to display raw data.
   */
  public clearFilters() {
    this.activeFilters = [];
    this.updateAllCharts();
  }

  /**
   * Returns a copy of the currently active global dimension filters.
   */
  public getActiveFilters(): Filter[] {
    return [...this.activeFilters];
  }

  /**
   * Replaces an existing chart with a new one in-place, reusing the DOM slot and applying layout updates.
   */
  public replaceChart(oldChart: Chart, newChart: Chart) {
    const index = this.charts.indexOf(oldChart);
    if (index === -1) return;

    const chartContainer = oldChart.getContainer();
    if (!chartContainer) return;

    oldChart.dispose();

    chartContainer.style.height = `calc(${this.config.rowHeight} * ${newChart.heightRows} + ${this.config.gap} * (${newChart.heightRows} - 1))`;
    chartContainer.style.gridColumn = `span ${Math.min(newChart.widthColumns, this.config.columns!)}`;
    chartContainer.style.gridRow = `span ${newChart.heightRows}`;
    chartContainer.innerHTML = '';

    this.charts[index] = newChart;

    newChart.setDashboardTheme(this.config.theme);

    const resolvedTheme = newChart.getConfig().theme ?? this.config.theme ?? 'common';
    newChart.setResolvedTheme(resolvedTheme);
    const resolvedLimit = newChart.getConfig().limitCategories ?? this.config.limitCategories;
    newChart.setResolvedLimitCategories(resolvedLimit);
    newChart.mount(chartContainer);

    newChart.onFilter((filter: Filter) => {
      this.toggleFilter(filter);
    });

    if (this.data.length > 0) {
      newChart.render(this.getFilteredDataForChart(newChart), this.activeFilters);
    }
  }

  /**
   * Finds a chart by its array index, or by matching its unique ID, dimension or title string.
   */
  public getChart(identifier: string | number): Chart | undefined {
    if (typeof identifier === 'number') {
      return this.charts[identifier];
    }
    return this.charts.find(chart => {
      const config = chart.getConfig();
      return config.id === identifier || config.dimension === identifier || config.title === identifier;
    });
  }

  /**
   * Checks if a chart exists in the dashboard by reference, or by matching its unique ID, dimension or title string.
   */
  public hasChart(chart: Chart | string): boolean {
    if (chart instanceof Chart) {
      return this.charts.includes(chart);
    }
    return this.charts.some(c => {
      const config = c.getConfig();
      return config.id === chart || config.dimension === chart || config.title === chart;
    });
  }

  /** Resizes all dashboard charts manually. */
  public resize(): void {
    this.charts.forEach(c => c.resize());
  }

  /** Exports the entire dashboard as a single Base64 image data URL. */
  public getDataURL(type = 'image/png', options?: any): string | undefined {
    if (this.charts.length === 0) return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = this.container.offsetWidth;
    canvas.height = this.container.offsetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dbStyle = window.getComputedStyle(this.container);
    ctx.fillStyle = dbStyle.backgroundColor || '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.charts.forEach(chart => {
      const child = chart.getContainer();
      if (!child) return;
      const parentRect = this.container.getBoundingClientRect();
      const childRect = child.getBoundingClientRect();
      const x = childRect.left - parentRect.left;
      const y = childRect.top - parentRect.top;
      const w = childRect.width;
      const h = childRect.height;

      const childStyle = window.getComputedStyle(child);
      const borderRadius = parseFloat(childStyle.borderRadius) || 0;
      ctx.save();
      ctx.fillStyle = childStyle.backgroundColor || '#ffffff';
      if (childStyle.boxShadow && childStyle.boxShadow !== 'none') {
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
      }
      if (borderRadius > 0) {
        ctx.beginPath();
        ctx.moveTo(x + borderRadius, y);
        ctx.lineTo(x + w - borderRadius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
        ctx.lineTo(x + w, y + h - borderRadius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - borderRadius, y + h);
        ctx.lineTo(x + borderRadius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
        ctx.lineTo(x, y + borderRadius);
        ctx.quadraticCurveTo(x, y, x + borderRadius, y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(x, y, w, h);
      }
      ctx.restore();

      const chartCanvas = child.querySelector('canvas') as HTMLCanvasElement;
      if (chartCanvas) {
        ctx.drawImage(
          chartCanvas,
          x + chartCanvas.offsetLeft,
          y + chartCanvas.offsetTop,
          chartCanvas.offsetWidth,
          chartCanvas.offsetHeight
        );
      } else {
        const titleEl = child.querySelector('.card-title') as HTMLElement;
        const valueEl = child.querySelector('.card-value') as HTMLElement;
        if (titleEl && valueEl) {
          ctx.save();
          ctx.fillStyle = window.getComputedStyle(titleEl).color || '#666';
          ctx.font = `bold 12px ${window.getComputedStyle(titleEl).fontFamily || 'sans-serif'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(titleEl.innerText, x + w / 2, y + h / 2 - 15);

          ctx.fillStyle = window.getComputedStyle(valueEl).color || '#333';
          ctx.font = `bold 32px ${window.getComputedStyle(valueEl).fontFamily || 'sans-serif'}`;
          ctx.fillText(valueEl.innerText, x + w / 2, y + h / 2 + 20);
          ctx.restore();
        }
      }
    });

    return canvas.toDataURL(type, options);
  }

  /** Renders the active filters toolbar. */
  private renderToolbar() {
    if (this.config.showFilterToolbar === false) {
      if (this.toolbarEl && this.container.contains(this.toolbarEl)) {
        this.container.removeChild(this.toolbarEl);
        this.toolbarEl = undefined;
      }
      return;
    }

    if (!this.toolbarEl || !this.container.contains(this.toolbarEl)) {
      this.toolbarEl = document.createElement('div');
      this.toolbarEl.className = 'dashboard-toolbar';
      this.toolbarEl.style.gridColumn = '1 / -1';
      this.toolbarEl.style.boxSizing = 'border-box';
      this.container.prepend(this.toolbarEl);
    }

    if (this.activeFilters.length === 0) {
      this.toolbarEl.style.display = 'none';
      return;
    }

    const themeName = this.config.theme ?? 'common';
    const styles = THEMES[themeName];

    this.toolbarEl.style.display = 'flex';
    this.toolbarEl.style.alignItems = 'center';
    this.toolbarEl.style.justifyContent = 'space-between';
    this.toolbarEl.style.flexWrap = 'wrap';
    this.toolbarEl.style.gap = '12px';
    this.toolbarEl.style.padding = '12px 18px';
    this.toolbarEl.style.marginBottom = '10px';
    this.toolbarEl.style.background = styles.containerBackground;
    this.toolbarEl.style.border = styles.containerBorder;
    this.toolbarEl.style.borderRadius = styles.containerBorderRadius;
    this.toolbarEl.style.boxShadow = styles.containerBoxShadow;
    this.toolbarEl.style.color = styles.textColor;
    this.toolbarEl.style.fontFamily = styles.fontFamily ?? 'sans-serif';
    this.toolbarEl.style.transition = styles.containerTransition;

    if (styles.containerBackdropFilter) {
      this.toolbarEl.style.backdropFilter = styles.containerBackdropFilter;
      (this.toolbarEl.style as any).webkitBackdropFilter = styles.containerBackdropFilter;
    } else {
      this.toolbarEl.style.backdropFilter = 'none';
      (this.toolbarEl.style as any).webkitBackdropFilter = 'none';
    }

    const pillBg = themeName === 'minimal' ? '#f4f4f5'
                 : themeName === 'glass' ? 'rgba(255, 255, 255, 0.1)'
                 : themeName === 'neon' ? 'rgba(0, 242, 254, 0.1)'
                 : themeName === 'elegant' ? 'rgba(212, 175, 55, 0.1)'
                 : themeName === 'sketch' ? '#faf9f6'
                 : 'rgba(0, 0, 0, 0.05)';

    const pillBorder = themeName === 'sketch' ? '2px solid #2b2b2b'
                     : themeName === 'neon' ? '1px solid rgba(0, 242, 254, 0.3)'
                     : themeName === 'elegant' ? '1px solid rgba(212, 175, 55, 0.3)'
                     : themeName === 'glass' ? '1px solid rgba(255, 255, 255, 0.2)'
                     : '1px solid rgba(0, 0, 0, 0.1)';

    this.toolbarEl.innerHTML = '';

    const leftContainer = document.createElement('div');
    leftContainer.style.display = 'flex';
    leftContainer.style.alignItems = 'center';
    leftContainer.style.gap = '8px';
    leftContainer.style.flexWrap = 'wrap';

    const label = document.createElement('span');
    label.innerText = 'Active Filters:';
    label.style.fontWeight = '600';
    label.style.fontSize = '13px';
    label.style.opacity = '0.8';
    leftContainer.appendChild(label);

    this.activeFilters.forEach(filter => {
      const pill = document.createElement('div');
      pill.style.display = 'inline-flex';
      pill.style.alignItems = 'center';
      pill.style.gap = '6px';
      pill.style.padding = '4px 10px';
      pill.style.fontSize = '12px';
      pill.style.fontWeight = '500';
      pill.style.background = pillBg;
      pill.style.border = pillBorder;
      pill.style.borderRadius = themeName === 'sketch' ? '4px' : '999px';
      pill.style.boxShadow = themeName === 'sketch' ? '2px 2px 0px #2b2b2b' : 'none';

      const text = document.createElement('span');
      const valStr = Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value);
      text.innerText = `${filter.field}: ${valStr}`;
      pill.appendChild(text);

      const closeBtn = document.createElement('span');
      closeBtn.innerText = '✕';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontWeight = 'bold';
      closeBtn.style.opacity = '0.6';
      closeBtn.style.transition = 'opacity 0.2s';
      closeBtn.onmouseenter = () => { closeBtn.style.opacity = '1'; };
      closeBtn.onmouseleave = () => { closeBtn.style.opacity = '0.6'; };
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        this.removeFilter(filter.field);
      };
      pill.appendChild(closeBtn);

      leftContainer.appendChild(pill);
    });

    this.toolbarEl.appendChild(leftContainer);

    const clearBtn = document.createElement('button');
    clearBtn.innerText = 'Clear All';
    clearBtn.style.background = 'transparent';
    clearBtn.style.border = themeName === 'sketch' ? '2px solid #2b2b2b'
                            : themeName === 'neon' ? '1px solid #ff007f'
                            : themeName === 'elegant' ? '1px solid #c5a059'
                            : '1px solid rgba(0, 0, 0, 0.15)';
    clearBtn.style.color = themeName === 'neon' ? '#ff007f'
                           : themeName === 'elegant' ? '#c5a059'
                           : 'inherit';
    clearBtn.style.padding = '4px 12px';
    clearBtn.style.fontSize = '12px';
    clearBtn.style.fontWeight = '600';
    clearBtn.style.borderRadius = themeName === 'sketch' ? '4px' : '6px';
    clearBtn.style.cursor = 'pointer';
    clearBtn.style.boxShadow = themeName === 'sketch' ? '2px 2px 0px #2b2b2b' : 'none';
    clearBtn.style.transition = 'all 0.2s ease';

    const hoverColor = themeName === 'neon' ? 'rgba(255, 0, 127, 0.15)'
                       : themeName === 'elegant' ? 'rgba(197, 160, 89, 0.15)'
                       : 'rgba(0, 0, 0, 0.05)';
    clearBtn.onmouseenter = () => {
      clearBtn.style.background = hoverColor;
      if (themeName === 'sketch') {
        clearBtn.style.transform = 'translate(-1px, -1px)';
        clearBtn.style.boxShadow = '3px 3px 0px #2b2b2b';
      }
    };
    clearBtn.onmouseleave = () => {
      clearBtn.style.background = 'transparent';
      if (themeName === 'sketch') {
        clearBtn.style.transform = 'none';
        clearBtn.style.boxShadow = '2px 2px 0px #2b2b2b';
      }
    };
    clearBtn.onclick = () => {
      this.clearFilters();
    };

    this.toolbarEl.appendChild(clearBtn);
  }
}
