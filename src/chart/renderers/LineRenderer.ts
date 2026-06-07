import { AxisRenderer } from './AxisRenderer';
import { Filter } from '../types';
import { getCanvasColor, drawSketchyLine, drawSketchyArc, getNiceTicks, truncateText } from './canvasUtils';
import { computeItemOpacity, getColorDef } from './themeHelpers';

/** Renders Line charts with optional smooth curves, area fills, and markers. */
export class LineRenderer extends AxisRenderer {
  protected override getLayout(
    categoriesCount: number,
    yMax: number,
    ctx: CanvasRenderingContext2D,
    fontFamily: string,
    config: any
  ) {
    const baseLayout = super.getLayout(categoriesCount, yMax, ctx, fontFamily, config);
    const areaWidth = baseLayout.plotWidth / Math.max(1, categoriesCount);

    return {
      ...baseLayout,
      areaWidth
    };
  }

  /** Draws line path, area fill, markers, axes, and category labels. */
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

    const { plotWidth, plotHeight, ticks, areaWidth } = this.getLayout(
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

    // Point coordinates
    const points = categories.map((_, index) => {
      const ratio = ratios[index] || 0;
      const x = this.padding.left + (index * areaWidth) + (areaWidth / 2);
      const y = this.padding.top + plotHeight - Math.min(ratio, 1.0) * plotHeight;
      return { x, y };
    });

    const isSmooth = styles.extraLineStyle?.smooth ?? false;
    const colorDef = getColorDef(0, config, styles);
    const strokeColor = getCanvasColor(ctx, colorDef, this.padding.left, this.padding.top, plotWidth, plotHeight);

    const chartFilter = activeFilters.find(f => f.field === config.dimension);

    // Area fill
    if (styles.extraAreaStyle && points.length > 0) {
      ctx.save();
      const fillGradientDef = styles.extraAreaStyle.color || {
        type: 'linear',
        colorStops: [
          { offset: 0, color: 'rgba(99, 102, 241, 0.4)' },
          { offset: 1, color: 'rgba(99, 102, 241, 0.01)' }
        ]
      };
      
      ctx.fillStyle = getCanvasColor(ctx, fillGradientDef, this.padding.left, this.padding.top, plotWidth, plotHeight);
      ctx.beginPath();
      ctx.moveTo(points[0].x, this.padding.top + plotHeight);
      ctx.lineTo(points[0].x, points[0].y);

      if (isSmooth) {
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[i];
          const p1 = points[i + 1];
          const cpX1 = p0.x + (p1.x - p0.x) * 0.4;
          const cpY1 = p0.y;
          const cpX2 = p0.x + (p1.x - p0.x) * 0.6;
          const cpY2 = p1.y;
          ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, p1.x, p1.y);
        }
      } else {
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
      }

      ctx.lineTo(points[points.length - 1].x, this.padding.top + plotHeight);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Line path
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = styles.extraLineStyle?.width || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (theme === 'sketch') {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = styles.textColor;
      for (let i = 0; i < points.length - 1; i++) {
        drawSketchyLine(ctx, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      if (isSmooth) {
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[i];
          const p1 = points[i + 1];
          const cpX1 = p0.x + (p1.x - p0.x) * 0.4;
          const cpY1 = p0.y;
          const cpX2 = p0.x + (p1.x - p0.x) * 0.6;
          const cpY2 = p1.y;
          ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, p1.x, p1.y);
        }
      } else {
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
      }
      ctx.stroke();
    }
    ctx.restore();

    // Markers (hollow symbols)
    const baseSymbolSize = styles.extraLineSymbolStyle?.symbolSize || 5;

    categories.forEach((cat, index) => {
      const p = points[index];

      const finalOpacity = computeItemOpacity(
        String(cat), config.dimension, chartFilter, prevFilters,
        hoveredIndex, index, animationProgress
      );

      const isHovered = hoveredIndex === index;
      const isSelected = !chartFilter || String(cat) === String(chartFilter.value);
      let symbolSize = isHovered ? baseSymbolSize + 4 : (isSelected ? baseSymbolSize : baseSymbolSize - 1);

      ctx.save();
      ctx.globalAlpha = finalOpacity;
      ctx.fillStyle = theme === 'sketch' ? '#faf9f6' : '#fff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;

      if (theme === 'sketch') {
        ctx.strokeStyle = styles.textColor;
        drawSketchyArc(ctx, p.x, p.y, symbolSize, 0, Math.PI * 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, symbolSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();

      // X-axis labels
      ctx.save();
      ctx.fillStyle = styles.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = `10px ${styles.fontFamily || 'sans-serif'}`;
      const truncatedLabel = truncateText(ctx, String(cat), areaWidth - 6);
      ctx.fillText(truncatedLabel, p.x, this.padding.top + plotHeight + 6);
      ctx.restore();
    });

    ctx.restore();
  }

  /** Returns the data point index at the given pixel coordinates. */
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

    const { areaWidth } = this.getLayout(
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
    const index = Math.floor(relativeX / areaWidth);

    if (index >= 0 && index < categories.length) {
      return index;
    }

    return null;
  }
}
