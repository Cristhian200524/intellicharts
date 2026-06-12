import { Chart } from '../chart/Chart';
import { Filter } from '../chart/types';
import { ChartTheme, THEMES } from '../themes/themes';
import { parseCSV } from '../utils/csvParser';
import { injectGoogleFonts } from '../utils/fontLoader';
import { autogenerate, DataType } from '../utils/autogenerate';
import { DashboardConfig } from './types';
import { renderDashboardToolbar } from './filterToolbar';
import { exportDashboardToDataURL } from '../utils/dashboardExporter';

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
    this.config = { columns: 3, gap: '20px', rowHeight: '300px', theme: 'common', showFilterToolbar: false, ...config };

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
    return exportDashboardToDataURL(this.container, this.charts, type, options);
  }

  /** Downloads the entire dashboard layout as a single consolidated image. */
  public download(filename = 'dashboard.png', type = 'image/png', options?: any): void {
    const dataUrl = this.getDataURL(type, options);
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    }
  }

  /** Renders the active filters toolbar. */
  private renderToolbar() {
    this.toolbarEl = renderDashboardToolbar(
      this.container,
      this.config,
      this.activeFilters,
      this.toolbarEl,
      (field) => this.removeFilter(field),
      () => this.clearFilters()
    );
  }
}

