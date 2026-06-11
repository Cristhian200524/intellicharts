import { BaseRenderer, DEFAULT_PADDING } from './BaseRenderer';
import { getNiceTicks } from './utils/canvasUtils';

/**
 * AxisRenderer is an intermediate base class for axis-based charts (like Bar and Line charts).
 * It encapsulates shared layout logic, grid ticks calculation, and axis rendering
 * to eliminate code duplication across different Cartesian coordinate chart renderers.
 */
export abstract class AxisRenderer extends BaseRenderer {
  /** Padding configuration around the chart plot area. */
  protected padding = { ...DEFAULT_PADDING };

  /**
   * Calculates the layout boundaries for the chart, dynamically determining the left padding
   * based on the width of the Y-axis label text to avoid truncation.
   * 
   * @param _categoriesCount Number of categories on the X-axis (unused in base layout calculation).
   * @param yMax Maximum value for the Y-axis scale.
   * @param ctx The Canvas 2D rendering context.
   * @param fontFamily The font family configured by the theme.
   * @param config The chart configuration.
   */
  protected getLayout(
    _categoriesCount: number,
    yMax: number,
    ctx: CanvasRenderingContext2D,
    fontFamily: string,
    config: any
  ) {
    const { width, height } = this.context;
    const { ticks } = getNiceTicks(0, yMax, 5);

    ctx.save();
    ctx.font = `10px ${fontFamily}`;
    let maxTextWidth = 0;
    
    ticks.forEach(tick => {
      let labelText = '';
      if (config.asPercentage) {
        labelText = `${tick.toFixed(0)}%`;
      } else {
        labelText = config.valueFormatter ? config.valueFormatter(tick) : tick.toFixed(0);
      }
      const textWidth = ctx.measureText(labelText).width;
      if (textWidth > maxTextWidth) {
        maxTextWidth = textWidth;
      }
    });
    ctx.restore();

    // Dynamically adjust left padding to prevent Y-axis labels from being cut off
    const currentPaddingLeft = Math.max(30, maxTextWidth + 12);
    this.padding.left = currentPaddingLeft;

    const plotWidth = Math.max(0, width - this.padding.left - this.padding.right);
    const plotHeight = Math.max(0, height - this.padding.top - this.padding.bottom);

    return {
      plotWidth,
      plotHeight,
      ticks,
      yMax
    };
  }

  /**
   * Renders the gridlines, Y-axis labels, and axis lines for the Cartesian chart.
   * 
   * @param ticks Array of numerical tick values to draw.
   * @param yMax Maximum Y value.
   * @param plotHeight Height of the plot drawing area.
   * @param config Chart configuration.
   * @param styles Active theme styles.
   */
  protected renderAxesAndGrid(
    ticks: number[],
    yMax: number,
    plotHeight: number,
    config: any,
    styles: any
  ): void {
    const { ctx, width } = this.context;

    // 1. Gridlines and Y-axis labels
    ctx.font = `10px ${styles.fontFamily || 'sans-serif'}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    ticks.forEach((tick) => {
      const ratio = yMax > 0 ? tick / yMax : 0;
      const yPixel = this.padding.top + plotHeight - (plotHeight * ratio);

      let labelText = '';
      if (config.asPercentage) {
        labelText = `${tick.toFixed(0)}%`;
      } else {
        labelText = config.valueFormatter ? config.valueFormatter(tick) : tick.toFixed(0);
      }

      // Draw numerical label on Y-axis
      ctx.fillStyle = styles.textColor;
      ctx.fillText(labelText, this.padding.left - 8, yPixel);

      // Draw horizontal grid line
      if (tick > 0) {
        ctx.strokeStyle = styles.gridLineColor || '#eee';
        ctx.lineWidth = 1;

        if (styles.gridLineType === 'dashed' || styles.gridLineType === 'dotted') {
          ctx.setLineDash([4, 4]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(this.padding.left, yPixel);
        ctx.lineTo(width - this.padding.right, yPixel);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // 2. Axis lines (X and Y borders)
    ctx.strokeStyle = styles.axisLineColor || '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.padding.left, this.padding.top);
    ctx.lineTo(this.padding.left, this.padding.top + plotHeight);
    ctx.lineTo(width - this.padding.right, this.padding.top + plotHeight);
    ctx.stroke();
  }
}
