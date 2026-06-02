import { Chart, Filter } from './Chart';
import { ChartTheme } from './theme';
import { parseCSV } from './csv';

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
}

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

  constructor(container: HTMLElement, config?: DashboardConfig) {
    this.container = container;
    this.config = { columns: 3, gap: '20px', rowHeight: '300px', theme: 'common', ...config };

    this.container.style.display = 'grid';
    this.container.style.gridTemplateColumns = `repeat(${this.config.columns}, 1fr)`;
    this.container.style.gap = this.config.gap!;

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width < 576) {
          this.container.style.gridTemplateColumns = '1fr';
          Array.from(this.container.children).forEach((child: any) => {
            child.style.gridColumn = 'span 1';
          });
        } else if (width < 992 && this.config.columns! > 2) {
          const tabletCols = Math.min(2, this.config.columns!);
          this.container.style.gridTemplateColumns = `repeat(${tabletCols}, 1fr)`;
          this.charts.forEach((_, index) => {
            const child = this.container.children[index] as HTMLElement;
            child.style.gridColumn = `span 1`;
          });
        } else {
          this.container.style.gridTemplateColumns = `repeat(${this.config.columns}, 1fr)`;
          this.charts.forEach((chart, index) => {
            const child = this.container.children[index] as HTMLElement;
            child.style.gridColumn = `span ${Math.min(chart.widthColumns, this.config.columns!)}`;
          });
        }
      }
    });
    observer.observe(this.container);
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
    this.charts.forEach(chart => {
      if (chart.getConfig().theme !== undefined) {
        return;
      }

      chart.setResolvedTheme(theme);
      chart.applyContainerTheme(theme);
      if (this.data.length > 0) {
        chart.render(this.getFilteredDataForChart(chart));
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

    const resolvedTheme = chart.getConfig().theme ?? this.config.theme ?? 'common';
    chart.setResolvedTheme(resolvedTheme);

    chart.mount(chartContainer);

    chart.onFilter((filter: Filter) => {
      this.toggleFilter(filter);
    });
    
    if (this.data.length > 0) {
      chart.render(this.getFilteredDataForChart(chart));
    }
  }

  private toggleFilter(filter: Filter) {
    const index = this.activeFilters.findIndex(f => f.field === filter.field && f.value === filter.value);
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

  private updateAllCharts() {
    this.charts.forEach(chart => {
      chart.render(this.getFilteredDataForChart(chart));
    });
  }

  private getFilteredDataForChart(chart: Chart): any[] {
    const chartDimension = chart.getDimension();
    const chartType = chart.getType();
    
    return this.data.filter(row => {
      for (const filter of this.activeFilters) {
        if (chartType === 'card' || filter.field !== chartDimension) {
          if (String(row[filter.field]) !== String(filter.value)) {
            return false;
          }
        }
      }
      return true;
    });
  }
}
