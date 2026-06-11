import { BaseRenderer } from './BaseRenderer';
import { Filter } from '../types';
import { getCanvasColor, drawSketchyLine, truncateText } from './utils/canvasUtils';
import { computeItemOpacity, getColorDef, getItemTextColor, isStyledTheme, isRoundedTheme } from './utils/styleUtils';

/** Renders Funnel charts as stacked descending trapezoids. */
export class FunnelRenderer extends BaseRenderer {
  private getLayout() {
    const { width, height } = this.context;
    const cx = width / 2;
    const plotWidth = width * 0.75;
    const plotHeight = Math.max(0, height - 80);
    const startY = 60;
    const gap = 3;

    return {
      cx,
      plotWidth,
      plotHeight,
      startY,
      gap
    };
  }

  private getSortedItems(categories: string[], values: number[], targetValues: number[]) {
    return categories
      .map((cat, i) => ({
        cat,
        val: values[i] ?? 0,
        targetVal: targetValues[i] ?? 0,
        originalIndex: i
      }))
      .sort((a, b) => b.targetVal - a.targetVal);
  }

  /** Draws funnel trapezoids with labels inside each segment. */
  render(
    categories: string[],
    ratios: number[],
    targetValues: number[],
    _yMax: number,
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

    const { cx, plotWidth, plotHeight, startY, gap } = this.getLayout();
    const sorted = this.getSortedItems(categories, ratios, targetValues);
    const count = sorted.length;

    const totalHeight = plotHeight;
    const itemHeight = (totalHeight - gap * (count - 1)) / count;

    ctx.save();
    this.renderTitle();

    const chartFilter = activeFilters.find(f => f.field === config.dimension);

    sorted.forEach((item, index) => {
      const topRatio = item.val;
      const bottomRatio = sorted[index + 1]?.val ?? 0;

      const topWidth = Math.min(topRatio, 1.0) * plotWidth;
      const bottomWidth = Math.min(bottomRatio, 1.0) * plotWidth;

      const y1 = startY + index * (itemHeight + gap);
      const y2 = y1 + itemHeight;

      const x1_left = cx - topWidth / 2;
      const x1_right = cx + topWidth / 2;
      const x2_left = cx - bottomWidth / 2;
      const x2_right = cx + bottomWidth / 2;

      const finalOpacity = computeItemOpacity(
        String(item.cat), config.dimension, chartFilter, prevFilters,
        hoveredIndex, item.originalIndex, animationProgress
      );

      ctx.save();
      ctx.globalAlpha = finalOpacity;

      const colorDef = getColorDef(item.originalIndex, config, styles);
      const fillStyle = getCanvasColor(ctx, colorDef, x1_left, y1, topWidth, itemHeight);
      ctx.fillStyle = fillStyle;

      if (theme === 'sketch') {
        ctx.beginPath();
        ctx.moveTo(x1_left, y1);
        ctx.lineTo(x1_right, y1);
        ctx.lineTo(x2_right, y2);
        ctx.lineTo(x2_left, y2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = styles.textColor;
        ctx.lineWidth = 2;
        drawSketchyLine(ctx, x1_left, y1, x1_right, y1);
        drawSketchyLine(ctx, x1_right, y1, x2_right, y2);
        drawSketchyLine(ctx, x2_right, y2, x2_left, y2);
        drawSketchyLine(ctx, x2_left, y2, x1_left, y1);
      } else {
        ctx.beginPath();
        ctx.moveTo(x1_left, y1);
        ctx.lineTo(x1_right, y1);
        ctx.lineTo(x2_right, y2);
        ctx.lineTo(x2_left, y2);
        ctx.closePath();
        ctx.fill();

        if (isStyledTheme(theme)) {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 4;
          if (isRoundedTheme(theme)) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          } else {
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'miter';
          }
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();

      // Labels inside segments
      ctx.save();
      ctx.globalAlpha = finalOpacity;
      ctx.font = `bold 10px ${styles.fontFamily || 'sans-serif'}`;
      ctx.fillStyle = getItemTextColor(theme, colorDef);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const targetMaxVal = sorted[0]?.targetVal || 100;
      let displayVal = '';
      if (config.asPercentage) {
        displayVal = `${((item.targetVal / targetMaxVal) * 100).toFixed(0)}%`;
      } else {
        displayVal = config.valueFormatter ? config.valueFormatter(item.targetVal) : String(item.targetVal);
      }

      const labelText = `${item.cat}: ${displayVal}`;
      const avgWidth = (topWidth + bottomWidth) / 2;
      const truncatedLabel = truncateText(ctx, labelText, avgWidth - 16);

      ctx.fillText(truncatedLabel, cx, y1 + itemHeight / 2);
      ctx.restore();
    });

    ctx.restore();
  }

  /** Returns the segment index at the given pixel coordinates. */
  hitTest(
    x: number,
    y: number,
    categories: string[],
    values: number[]
  ): number | null {
    if (categories.length === 0) return null;

    const { cx, plotWidth, plotHeight, startY, gap } = this.getLayout();
    const sorted = this.getSortedItems(categories, values, values);
    const count = sorted.length;

    const totalHeight = plotHeight;
    const itemHeight = (totalHeight - gap * (count - 1)) / count;
    const maxVal = sorted[0]?.targetVal || 100;

    if (y < startY || y > startY + totalHeight) {
      return null;
    }

    for (let index = 0; index < count; index++) {
      const y1 = startY + index * (itemHeight + gap);
      const y2 = y1 + itemHeight;

      if (y >= y1 && y <= y2) {
        const item = sorted[index];
        const topVal = item.val;
        const bottomVal = sorted[index + 1]?.val ?? 0;

        const topWidth = (topVal / maxVal) * plotWidth;
        const bottomWidth = (bottomVal / maxVal) * plotWidth;

        const ratio = (y - y1) / itemHeight;
        const w = topWidth + (bottomWidth - topWidth) * ratio;

        const leftLimit = cx - w / 2;
        const rightLimit = cx + w / 2;

        if (x >= leftLimit && x <= rightLimit) {
          return item.originalIndex;
        }
      }
    }

    return null;
  }
}
