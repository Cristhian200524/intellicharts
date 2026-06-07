import { ChartConfig, Filter } from '../types';
import { ChartTheme, ThemeStyles } from '../../theme';
import { truncateText } from './canvasUtils';

/** Execution context passed to all renderers. */
export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  config: ChartConfig;
  theme: ChartTheme;
  styles: ThemeStyles;
  dpr: number;
}

/** Default padding for axis-based charts (bar, line). */
export const DEFAULT_PADDING = { top: 60, right: 15, bottom: 30, left: 35 };

/** Base class for all chart renderers. */
export abstract class BaseRenderer {
  protected context: RenderContext;

  constructor(context: RenderContext) {
    this.context = context;
  }

  /** Renders a centered "No data available" message. */
  protected renderEmptyState(): void {
    const { ctx, width, height, styles } = this.context;
    ctx.fillStyle = styles.textColor;
    ctx.font = `14px ${styles.fontFamily || 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.fillText('No data available', width / 2, height / 2);
  }

  /** Renders the chart title in the top-left corner. */
  protected renderTitle(): void {
    const { ctx, width, config, styles } = this.context;
    if (!config.title) return;
    ctx.fillStyle = styles.textColor;
    ctx.font = `bold 14px ${styles.fontFamily || 'sans-serif'}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const truncatedTitle = truncateText(ctx, config.title, width - 30);
    ctx.fillText(truncatedTitle, 15, 20);
  }

  /** Draws the chart on the canvas. */
  abstract render(
    categories: string[],
    ratios: number[],
    targetValues: number[],
    yMax: number,
    animationProgress: number,
    isFirstRender: boolean,
    hoveredIndex: number | null,
    activeFilters: Filter[],
    prevFilters: Filter[]
  ): void;

  /** Returns the data index at the given pixel coordinates, or null. */
  abstract hitTest(
    x: number,
    y: number,
    categories: string[],
    values: number[]
  ): number | null;
}
