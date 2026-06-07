import { AxisRenderer } from './AxisRenderer';
import { Filter } from '../types';
import { getCanvasColor, drawRoundedRect, drawSketchyRect, getNiceTicks, truncateText } from './canvasUtils';
import { computeItemOpacity, getColorDef } from './themeHelpers';

/** Renders Bar charts on an axis grid. */
export class BarRenderer extends AxisRenderer {
  protected override getLayout(
    categoriesCount: number,
    yMax: number,
    ctx: CanvasRenderingContext2D,
    fontFamily: string,
    config: any
  ) {
    const baseLayout = super.getLayout(categoriesCount, yMax, ctx, fontFamily, config);
    const barAreaWidth = baseLayout.plotWidth / Math.max(1, categoriesCount);
    const barWidth = Math.max(5, barAreaWidth * 0.6);

    return {
      ...baseLayout,
      barAreaWidth,
      barWidth
    };
  }

  /** Draws bars, axes, gridlines, and category labels. */
  render(
    categories: string[],
    ratios: number[],
    _targetValues: number[],
    yMax: number,
    animationProgress: number,
    _isFirstRender: boolean,
    hoveredIndex: number | null,
    activeFilters: Filter[],
    prevFilters: Filter[]
  ): void {
    const { ctx, width, height, config, theme, styles } = this.context;

    ctx.clearRect(0, 0, width, height);

    if (categories.length === 0) {
      this.renderEmptyState();
      return;
    }

    const { plotHeight, ticks, barAreaWidth, barWidth } = this.getLayout(
      categories.length,
      yMax,
      ctx,
      styles.fontFamily || 'sans-serif',
      config
    );

    ctx.save();
    this.renderTitle();

    // Render shared Y-axis gridlines, labels and border lines
    this.renderAxesAndGrid(ticks, yMax, plotHeight, config, styles);

    const chartFilter = activeFilters.find(f => f.field === config.dimension);

    categories.forEach((cat, index) => {
      const ratio = ratios[index] || 0;
      const barHeight = Math.min(ratio, 1.0) * plotHeight;

      const xMid = this.padding.left + (index * barAreaWidth) + (barAreaWidth / 2);
      const xLeft = xMid - (barWidth / 2);
      const yTop = this.padding.top + plotHeight - barHeight;

      const finalOpacity = computeItemOpacity(
        String(cat), config.dimension, chartFilter, prevFilters,
        hoveredIndex, index, animationProgress
      );

      ctx.save();
      ctx.globalAlpha = finalOpacity;

      const colorDef = getColorDef(index, config, styles);
      const fillStyle = getCanvasColor(ctx, colorDef, xLeft, yTop, barWidth, barHeight);

      ctx.fillStyle = fillStyle;

      const extraStyle = styles.extraBarItemStyle || {};

      if (theme === '3D') {
        ctx.shadowBlur = extraStyle.shadowBlur || 4;
        ctx.shadowColor = extraStyle.shadowColor || 'rgba(0,0,0,0.15)';
        ctx.shadowOffsetX = extraStyle.shadowOffsetX || 2;
        ctx.shadowOffsetY = extraStyle.shadowOffsetY || 2;
      }

      if (theme === 'sketch') {
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.rect(xLeft, yTop, barWidth, barHeight);
        ctx.fill();

        ctx.strokeStyle = styles.textColor;
        ctx.lineWidth = 2;
        drawSketchyRect(ctx, xLeft, yTop, barWidth, barHeight);
      } else {
        const radii = extraStyle.borderRadius || 0;
        if (radii) {
          drawRoundedRect(ctx, xLeft, yTop, barWidth, barHeight, radii);
          ctx.fill();
          if (extraStyle.borderWidth) {
            ctx.strokeStyle = extraStyle.borderColor || '#333';
            ctx.lineWidth = extraStyle.borderWidth;
            ctx.stroke();
          }
        } else {
          ctx.fillRect(xLeft, yTop, barWidth, barHeight);
        }
      }

      ctx.restore();

      // X-axis labels
      ctx.save();
      ctx.fillStyle = styles.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = `10px ${styles.fontFamily || 'sans-serif'}`;
      const truncatedLabel = truncateText(ctx, String(cat), barAreaWidth - 6);
      ctx.fillText(truncatedLabel, xMid, this.padding.top + plotHeight + 6);
      ctx.restore();
    });

    ctx.restore();
  }

  /** Returns the bar index at the given pixel coordinates. */
  hitTest(
    x: number,
    y: number,
    categories: string[],
    values: number[]
  ): number | null {
    if (categories.length === 0) return null;

    const { width, height, config, styles } = this.context;
    const maxVal = Math.max(...values, 0);
    let paddedMax = maxVal > 0 ? maxVal * 1.15 : 100;
    if (config.asPercentage) {
      paddedMax = Math.min(100, paddedMax);
    }
    const { max: yMax } = getNiceTicks(0, paddedMax, 5);

    const { barAreaWidth, barWidth } = this.getLayout(
      categories.length,
      yMax,
      this.context.ctx,
      styles.fontFamily || 'sans-serif',
      config
    );

    if (x < this.padding.left || x > width - this.padding.right) {
      return null;
    }
    if (y < this.padding.top || y > height - this.padding.bottom) {
      return null;
    }

    const relativeX = x - this.padding.left;
    const index = Math.floor(relativeX / barAreaWidth);

    if (index >= 0 && index < categories.length) {
      const xMid = this.padding.left + (index * barAreaWidth) + (barAreaWidth / 2);
      const xLeft = xMid - (barWidth / 2);
      const xRight = xMid + (barWidth / 2);

      if (x >= xLeft && x <= xRight) {
        return index;
      }
    }

    return null;
  }
}
