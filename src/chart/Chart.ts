import { ChartTheme, THEMES } from '../themes/themes';
import { parseCSV } from '../utils/csvParser';
import { ChartConfig, Filter } from './types';
import { Animator, TransitionManager } from './animation';
import { BaseRenderer } from './renderers/BaseRenderer';
import { BarRenderer } from './renderers/BarRenderer';
import { LineRenderer } from './renderers/LineRenderer';
import { PieRenderer } from './renderers/PieRenderer';
import { RadarRenderer } from './renderers/RadarRenderer';
import { FunnelRenderer } from './renderers/FunnelRenderer';
import { CardRenderer } from './renderers/CardRenderer';
import { getNiceTicks, updateTooltip } from './renderers/utils/canvasUtils';
import { getColorDef, resolveColorString } from './renderers/utils/styleUtils';
import { injectGoogleFonts } from '../utils/fontLoader';
import { resizeObserverManager } from '../utils/resizeObserverManager';
import { aggregateChartData } from '../utils/dataProcessor';
import { getOthersBreakdownHTML } from '../utils/tooltipFormatter';

/**
 * Handles chart widget mounts and draws.
 */
export class Chart {
  private config: ChartConfig;
  private filterCallback?: (filter: Filter) => void;
  public widthColumns: number;
  public heightRows: number;
  private lastData: any[] = [];
  private container?: HTMLElement;
  private resolvedTheme?: ChartTheme;
  private resolvedLimitCategories?: number;
  private othersDetails: { category: string, value: number }[] = [];
  private rawTotal = 0;
  private dashboardTheme?: ChartTheme;
  private isStandalone = true;

  // Custom canvas engine properties
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private currentAnimationProgress = 1.0;
  private animator: Animator = new Animator();
  private transitionManager: TransitionManager = new TransitionManager();
  private activeRenderer?: BaseRenderer;
  private tooltipEl?: HTMLElement;
  private hoveredIndex: number | null = null;
  private categories: string[] = [];
  private values: number[] = [];
  private activeFilters: Filter[] = [];
  private prevFilters: Filter[] = [];

  constructor(config: ChartConfig) {
    injectGoogleFonts();
    this.config = config;
    this.widthColumns = config.column ?? config.widthColumns ?? 1;
    this.heightRows = config.heightRows ?? 1;
    this.resolvedLimitCategories = config.limitCategories;
  }

  public setResolvedTheme(theme: ChartTheme) {
    this.resolvedTheme = theme;
  }

  public setResolvedLimitCategories(limit?: number) {
    this.resolvedLimitCategories = limit;
  }

  public getResolvedLimitCategories(): number | undefined {
    return this.resolvedLimitCategories;
  }

  public setDashboardTheme(theme?: ChartTheme) {
    this.dashboardTheme = theme;
  }

  public getDashboardTheme(): ChartTheme | undefined {
    return this.dashboardTheme;
  }

  public setIsStandalone(value: boolean) {
    this.isStandalone = value;
  }

  public setTheme(theme: ChartTheme) {
    this.setResolvedTheme(theme);
    this.applyContainerTheme(theme);
    if (this.lastData.length > 0) {
      this.render(this.lastData, this.activeFilters, true);
    }
  }

  public getResolvedTheme(): ChartTheme {
    return this.resolvedTheme ?? this.config.theme ?? 'common';
  }

  public getConfig(): ChartConfig {
    return this.config;
  }

  public applyContainerTheme(theme: ChartTheme) {
    if (!this.container) return;
    const styles = THEMES[theme];

    let background = styles.containerBackground;

    if (this.dashboardTheme) {
      const isDbDark = ['modern', 'glass', 'elegant', 'neon'].includes(this.dashboardTheme);
      const isChartDark = ['modern', 'glass', 'elegant', 'neon'].includes(theme);

      if (isChartDark && !isDbDark) {
        if (theme === 'glass') {
          background = 'rgba(15, 23, 42, 0.95)';
        } else if (theme === 'neon') {
          background = 'rgba(13, 12, 22, 0.95)';
        }
      }
    }

    this.container.style.background = background;
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

  public mount(container: HTMLElement) {
    this.container = container;

    const theme = this.getResolvedTheme();
    this.applyContainerTheme(theme);

    if (!this.container.style.height && (!this.container.offsetHeight || this.container.offsetHeight === 0)) {
      this.container.style.height = this.config.type === 'card' ? '100%' : '300px';
    }

    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d') || undefined;

    if (this.config.type !== 'card') {
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.className = 'chart-tooltip';
      this.tooltipEl.style.position = 'absolute';
      this.tooltipEl.style.pointerEvents = 'none';
      this.tooltipEl.style.zIndex = '1000';
      this.tooltipEl.style.display = 'none';
      this.tooltipEl.style.transition = 'opacity 0.15s ease';
      this.container.appendChild(this.tooltipEl);

      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
      this.canvas.addEventListener('click', () => this.handleMouseClick());
    }

    if (this.isStandalone) {
      resizeObserverManager.observe(container, () => {
        if (this.lastData.length > 0) {
          this.render(this.lastData, this.activeFilters, false);
        }
      });
    }

    if (this.lastData.length > 0) {
      this.render(this.lastData, this.activeFilters, true);
    }
  }

  private drawFrame(progress: number) {
    if (!this.ctx || !this.canvas || !this.activeRenderer) return;

    const targetYMax = this.calculateYMax(this.values);
    const currentRatios = this.transitionManager.getInterpolatedRatios(
      this.categories,
      this.values,
      targetYMax,
      progress
    );

    const isFirstRender = this.transitionManager.isFirstRender();

    this.activeRenderer.render(
      this.categories,
      currentRatios,
      this.values,
      targetYMax,
      progress,
      isFirstRender,
      this.hoveredIndex,
      this.activeFilters,
      this.prevFilters
    );
  }

  private getMouseCoords(e: MouseEvent): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.canvas || !this.activeRenderer || !this.tooltipEl) return;

    const { x, y } = this.getMouseCoords(e);
    const prevHovered = this.hoveredIndex;
    this.hoveredIndex = this.activeRenderer.hitTest(x, y, this.categories, this.values);

    this.canvas.style.cursor = this.hoveredIndex !== null ? 'pointer' : 'default';

    if (this.hoveredIndex !== null) {
      const cat = this.categories[this.hoveredIndex];
      const val = this.values[this.hoveredIndex];
      const theme = this.getResolvedTheme();
      const styles = THEMES[theme];

      let displayVal = '';
      if (this.config.asPercentage) {
        displayVal = `${val.toFixed(2)}%`;
      } else {
        displayVal = this.config.valueFormatter ? this.config.valueFormatter(val) : val.toLocaleString();
      }

      if (cat === 'Others' && this.othersDetails.length > 0) {
        displayVal += getOthersBreakdownHTML(
          this.othersDetails,
          this.rawTotal,
          theme,
          styles,
          this.config
        );
      }

      const colorDef = getColorDef(this.hoveredIndex, this.config, styles);
      const tooltipColor = resolveColorString(colorDef);

      updateTooltip(this.tooltipEl, x, y, String(cat), displayVal, styles, tooltipColor);
      
      if (prevHovered !== this.hoveredIndex) {
        this.drawFrame(1.0);
      }
    } else {
      this.tooltipEl.style.display = 'none';
      if (prevHovered !== null) {
        this.drawFrame(1.0);
      }
    }
  }

  private handleMouseLeave() {
    if (this.tooltipEl) {
      this.tooltipEl.style.display = 'none';
    }
    if (this.hoveredIndex !== null) {
      this.hoveredIndex = null;
      if (this.canvas) {
        this.canvas.style.cursor = 'default';
      }
      this.drawFrame(1.0);
    }
  }

  private handleMouseClick() {
    if (this.hoveredIndex !== null && this.filterCallback) {
      const cat = this.categories[this.hoveredIndex];
      const filterValue = (cat === 'Others' && this.othersDetails.length > 0)
        ? this.othersDetails.map(item => item.category)
        : cat;
      this.filterCallback({
        field: this.config.dimension,
        value: filterValue
      });
    }
  }

  public getDimension(): string {
    return this.config.dimension;
  }

  public getType(): string {
    return this.config.type;
  }

  public onFilter(cb: (filter: Filter) => void) {
    this.filterCallback = cb;
  }

  public getContainer(): HTMLElement | undefined {
    return this.container;
  }

  public dispose() {
    this.animator.cancel();
    if (this.container) {
      resizeObserverManager.unobserve(this.container);
    }
    
    if (this.canvas && this.container?.contains(this.canvas)) {
      this.container.removeChild(this.canvas);
      this.canvas = undefined;
    }
    if (this.tooltipEl && this.container?.contains(this.tooltipEl)) {
      this.container.removeChild(this.tooltipEl);
      this.tooltipEl = undefined;
    }

    if (this.container) {
      this.container.onmouseenter = null;
      this.container.onmouseleave = null;
    }
  }

  public render(data: any[] | string, activeFilters: Filter[] = [], animate = true) {
    const parsedData = typeof data === 'string' ? parseCSV(data) : data;
    this.lastData = parsedData;
    data = parsedData;
    this.prevFilters = [...this.activeFilters];
    this.activeFilters = [...activeFilters];
    const theme = this.getResolvedTheme();
    const t = THEMES[theme];

    if (!this.container || !this.canvas || !this.ctx) return;

    const aggResult = aggregateChartData(data, this.config, this.getResolvedLimitCategories());
    this.categories = aggResult.categories;
    this.values = aggResult.values;
    this.othersDetails = aggResult.othersDetails;
    this.rawTotal = aggResult.rawTotal;

    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    const renderContext = {
      ctx: this.ctx,
      width: rect.width,
      height: rect.height,
      config: this.config,
      theme,
      styles: t,
      dpr
    };

    if (this.config.type === 'bar') {
      this.activeRenderer = new BarRenderer(renderContext);
    } else if (this.config.type === 'line') {
      this.activeRenderer = new LineRenderer(renderContext);
    } else if (this.config.type === 'pie' || this.config.type === 'donut') {
      this.activeRenderer = new PieRenderer(renderContext);
    } else if (this.config.type === 'radar') {
      this.activeRenderer = new RadarRenderer(renderContext);
    } else if (this.config.type === 'funnel') {
      this.activeRenderer = new FunnelRenderer(renderContext);
    } else if (this.config.type === 'card') {
      this.activeRenderer = new CardRenderer(renderContext);
    }

    this.hoveredIndex = null;

    if (animate) {
      this.animator.start(450, 
        (progress) => {
          this.currentAnimationProgress = progress;
          this.drawFrame(progress);
        },
        () => {
          this.currentAnimationProgress = 1.0;
          const targetYMax = this.calculateYMax(this.values);
          this.transitionManager.saveRatios(this.categories, this.values, targetYMax);
        }
      );
    } else {
      this.currentAnimationProgress = 1.0;
      this.drawFrame(1.0);
      const targetYMax = this.calculateYMax(this.values);
      this.transitionManager.saveRatios(this.categories, this.values, targetYMax);
    }
  }

  /** Resizes and redraws the chart manually. */
  public resize(): void {
    if (this.lastData.length > 0) this.render(this.lastData, this.activeFilters, false);
  }

  /** Exports the current chart state as a Base64 image data URL. */
  public getDataURL(type = 'image/png', options?: any): string | undefined {
    if (!this.canvas) return undefined;
    if (this.lastData.length > 0) {
      const prevProgress = this.currentAnimationProgress;
      this.drawFrame(1.0);
      const url = this.canvas.toDataURL(type, options);
      if (prevProgress < 1.0) {
        this.drawFrame(prevProgress);
      }
      return url;
    }
    return this.canvas.toDataURL(type, options);
  }

  /** Downloads the current chart state as an image file. */
  public download(filename = 'chart.png', type = 'image/png', options?: any): void {
    const dataUrl = this.getDataURL(type, options);
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    }
  }

  /** Gets the current progress of the rendering animation. */
  public getCurrentAnimationProgress(): number {
    return this.currentAnimationProgress;
  }

  /** Forces the chart to render its final state (progress 1.0) synchronously. */
  public forceFinalFrame(): void {
    if (this.lastData.length > 0) {
      this.drawFrame(1.0);
    }
  }

  /** Restores the chart's rendering to a specific animation progress. */
  public restoreFrame(progress: number): void {
    if (this.lastData.length > 0) {
      this.drawFrame(progress);
    }
  }

  private calculateYMax(values: number[]): number {
    const maxVal = Math.max(...values, 0);
    if (this.config.type === 'bar' || this.config.type === 'line') {
      let paddedMax = maxVal > 0 ? maxVal * 1.15 : 100;
      if (this.config.asPercentage) {
        paddedMax = Math.min(100, paddedMax);
      }
      const { max } = getNiceTicks(0, paddedMax, 5);
      return max;
    } else if (this.config.type === 'radar') {
      return maxVal > 0 ? maxVal * 1.15 : 100;
    } else if (this.config.type === 'funnel') {
      return maxVal || 100;
    }
    return maxVal;
  }
}
