import { BaseRenderer } from './BaseRenderer';
import { Filter } from '../types';
import { getCanvasColor, drawSketchyArc, drawSketchyLine, truncateText } from './canvasUtils';
import { computeItemOpacity, getColorDef, resolveColorString, isRoundedTheme } from './themeHelpers';

/** Renders Pie and Donut charts with optional rounded sectors. */
export class PieRenderer extends BaseRenderer {
  private getLayout() {
    const { width, height, config } = this.context;
    const cx = width / 2;
    const cy = height / 2 + 10;

    const outerRadius = Math.min(width * 0.55, height - 90) / 2;
    const isDonut = config.type === 'donut';
    const innerRadius = isDonut ? outerRadius * 0.55 : 0;

    return {
      cx,
      cy,
      outerRadius,
      innerRadius
    };
  }

  /** Draws pie/donut slices with labels and connecting lines. */
  render(
    categories: string[],
    ratios: number[],
    targetValues: number[],
    _yMax: number,
    animationProgress: number,
    isFirstRender: boolean,
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

    const { cx, cy, outerRadius, innerRadius } = this.getLayout();
    const totalVal = ratios.reduce((sum, v) => sum + v, 0);

    ctx.save();
    this.renderTitle();

    const chartFilter = activeFilters.find(f => f.field === config.dimension);

    let startAngle = -Math.PI / 2;

    categories.forEach((cat, index) => {
      const val = ratios[index] || 0;
      const pct = totalVal > 0 ? val / totalVal : 0;
      
      const sweepScale = isFirstRender ? animationProgress : 1.0;
      const sweepAngle = pct * Math.PI * 2 * sweepScale;
      const endAngle = startAngle + sweepAngle;

      if (sweepAngle <= 0.001) return;

      const opacity = computeItemOpacity(
        String(cat), config.dimension, chartFilter, prevFilters,
        hoveredIndex, index, animationProgress
      );

      ctx.save();
      ctx.globalAlpha = opacity;

      const scaleRadius = isFirstRender ? animationProgress : 1.0;
      const isHovered = hoveredIndex === index;
      const currentOuterRadius = (isHovered ? outerRadius + 6 : outerRadius) * scaleRadius;
      const currentInnerRadius = innerRadius * scaleRadius;
      const midAngle = startAngle + sweepAngle / 2;

      const colorDef = getColorDef(index, config, styles);
      const fillStyle = getCanvasColor(
        ctx,
        colorDef,
        cx - currentOuterRadius,
        cy - currentOuterRadius,
        currentOuterRadius * 2,
        currentOuterRadius * 2
      );

      ctx.fillStyle = fillStyle;

      if (theme === 'sketch') {
        ctx.lineWidth = 2;
        ctx.strokeStyle = styles.textColor;

        ctx.beginPath();
        ctx.arc(cx, cy, currentOuterRadius, startAngle, endAngle);
        if (currentInnerRadius > 0) {
          ctx.arc(cx, cy, currentInnerRadius, endAngle, startAngle, true);
        } else {
          ctx.lineTo(cx, cy);
        }
        ctx.closePath();
        ctx.fill();

        drawSketchyArc(ctx, cx, cy, currentOuterRadius, startAngle, endAngle);
        if (currentInnerRadius > 0) {
          drawSketchyArc(ctx, cx, cy, currentInnerRadius, startAngle, endAngle);
          
          const r1x = cx + currentInnerRadius * Math.cos(startAngle);
          const r1y = cy + currentInnerRadius * Math.sin(startAngle);
          const r2x = cx + currentOuterRadius * Math.cos(startAngle);
          const r2y = cy + currentOuterRadius * Math.sin(startAngle);
          drawSketchyLine(ctx, r1x, r1y, r2x, r2y);

          const r3x = cx + currentInnerRadius * Math.cos(endAngle);
          const r3y = cy + currentInnerRadius * Math.sin(endAngle);
          const r4x = cx + currentOuterRadius * Math.cos(endAngle);
          const r4y = cy + currentOuterRadius * Math.sin(endAngle);
          drawSketchyLine(ctx, r3x, r3y, r4x, r4y);
        } else {
          const r1x = cx + currentOuterRadius * Math.cos(startAngle);
          const r1y = cy + currentOuterRadius * Math.sin(startAngle);
          drawSketchyLine(ctx, cx, cy, r1x, r1y);

          const r2x = cx + currentOuterRadius * Math.cos(endAngle);
          const r2y = cy + currentOuterRadius * Math.sin(endAngle);
          drawSketchyLine(ctx, cx, cy, r2x, r2y);
        }
      } else {
        if (isRoundedTheme(theme)) {
          drawRoundedSector(ctx, cx, cy, currentInnerRadius, currentOuterRadius, startAngle, endAngle, 5.5);
          ctx.fill();

          // Erase the radial boundary at endAngle with a thin gap
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2.0;
          ctx.lineCap = 'butt';
          ctx.beginPath();
          ctx.moveTo(cx + currentInnerRadius * Math.cos(endAngle), cy + currentInnerRadius * Math.sin(endAngle));
          ctx.lineTo(cx + currentOuterRadius * Math.cos(endAngle), cy + currentOuterRadius * Math.sin(endAngle));
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, currentOuterRadius, startAngle, endAngle);
          if (currentInnerRadius > 0) {
            ctx.arc(cx, cy, currentInnerRadius, endAngle, startAngle, true);
          } else {
            ctx.lineTo(cx, cy);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();

      // Outside labels and connecting lines
      if (pct > 0.02) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.font = `10px ${styles.fontFamily || 'sans-serif'}`;
        ctx.fillStyle = styles.textColor;

        const rTickStart = currentOuterRadius + 2;
        const rTickMid = currentOuterRadius + 12;

        const tx1 = cx + rTickStart * Math.cos(midAngle);
        const ty1 = cy + rTickStart * Math.sin(midAngle);
        const tx2 = cx + rTickMid * Math.cos(midAngle);
        const ty2 = cy + rTickMid * Math.sin(midAngle);

        const isRightSide = Math.cos(midAngle) >= 0;
        const tailLen = 8;
        const tx3 = tx2 + (isRightSide ? tailLen : -tailLen);

        const sliceColor = resolveColorString(colorDef);

        ctx.strokeStyle = sliceColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.lineTo(tx3, ty2);
        ctx.stroke();

        ctx.textAlign = isRightSide ? 'left' : 'right';
        ctx.textBaseline = 'middle';

        const targetVal = targetValues[index] || 0;
        let displayVal = '';
        if (config.asPercentage) {
          const targetTotal = targetValues.reduce((sum, v) => sum + v, 0);
          const targetPct = targetTotal > 0 ? targetVal / targetTotal : 0;
          displayVal = `${(targetPct * 100).toFixed(1)}%`;
        } else {
          displayVal = config.valueFormatter ? config.valueFormatter(targetVal) : String(targetVal);
        }

        const labelText = `${cat}: ${displayVal}`;
        const maxTextWidth = isRightSide ? (width - tx3 - 10) : (tx3 - 10);

        if (maxTextWidth > 20) {
          const truncatedLabel = truncateText(ctx, labelText, maxTextWidth);
          ctx.fillText(truncatedLabel, tx3 + (isRightSide ? 4 : -4), ty2);
        }
        ctx.restore();
      }

      startAngle = endAngle;
    });

    ctx.restore();
  }

  /** Returns the slice index at the given pixel coordinates. */
  hitTest(
    x: number,
    y: number,
    categories: string[],
    values: number[]
  ): number | null {
    if (categories.length === 0) return null;

    const { cx, cy, outerRadius, innerRadius } = this.getLayout();
    const totalVal = values.reduce((sum, v) => sum + v, 0);

    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.hypot(dx, dy);

    if (distance < innerRadius || distance > outerRadius + 8) {
      return null;
    }

    let mouseAngle = Math.atan2(dy, dx);
    if (mouseAngle < -Math.PI / 2) {
      mouseAngle += Math.PI * 2;
    }

    let startAngle = -Math.PI / 2;

    for (let i = 0; i < categories.length; i++) {
      const val = values[i] || 0;
      const pct = totalVal > 0 ? val / totalVal : 0;
      const sweepAngle = pct * Math.PI * 2;
      const endAngle = startAngle + sweepAngle;

      let normMouseAngle = mouseAngle;
      if (normMouseAngle < startAngle) {
        normMouseAngle += Math.PI * 2;
      }

      if (normMouseAngle >= startAngle && normMouseAngle <= endAngle) {
        return i;
      }

      startAngle = endAngle;
    }

    return null;
  }
}

/**
 * Draws a pie/donut sector with rounded corners using trigonometric arcTo.
 * Handles both full-pie (r_in = 0) and donut (r_in > 0) cases.
 */
function drawRoundedSector(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r_in: number,
  r_out: number,
  startAngle: number,
  endAngle: number,
  r_c: number
) {
  const sweepAngle = endAngle - startAngle;
  
  // Cap corner radius to prevent geometric overflow on small slices
  let radiusCorner = r_c;
  const maxRadiusCorner = Math.min(r_out * 0.15, (r_out - r_in > 0 ? r_out - r_in : r_out) * 0.4);
  if (radiusCorner > maxRadiusCorner) {
    radiusCorner = maxRadiusCorner;
  }
  if (radiusCorner < 0.5) {
    radiusCorner = 0;
  }

  if (radiusCorner === 0 || sweepAngle <= 0.05 || sweepAngle >= Math.PI * 1.95) {
    ctx.beginPath();
    ctx.arc(cx, cy, r_out, startAngle, endAngle);
    if (r_in > 0) {
      ctx.arc(cx, cy, r_in, endAngle, startAngle, true);
    } else {
      ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    return;
  }

  const alpha_out = Math.asin(radiusCorner / (r_out - radiusCorner));
  const d_out = (r_out - radiusCorner) * Math.cos(alpha_out);

  ctx.beginPath();
  if (r_in > 0) {
    const alpha_in = Math.asin(radiusCorner / (r_in + radiusCorner));
    const d_in = (r_in + radiusCorner) * Math.cos(alpha_in);

    ctx.moveTo(cx + d_in * Math.cos(startAngle), cy + d_in * Math.sin(startAngle));
    
    ctx.arcTo(
      cx + r_out * Math.cos(startAngle),
      cy + r_out * Math.sin(startAngle),
      cx + r_out * Math.cos(startAngle + alpha_out * 2),
      cy + r_out * Math.sin(startAngle + alpha_out * 2),
      radiusCorner
    );
    
    ctx.arc(cx, cy, r_out, startAngle + alpha_out, endAngle - alpha_out);
    
    ctx.arcTo(
      cx + r_out * Math.cos(endAngle),
      cy + r_out * Math.sin(endAngle),
      cx + d_out * Math.cos(endAngle),
      cy + d_out * Math.sin(endAngle),
      radiusCorner
    );
    
    ctx.lineTo(cx + d_in * Math.cos(endAngle), cy + d_in * Math.sin(endAngle));
    
    ctx.arcTo(
      cx + r_in * Math.cos(endAngle),
      cy + r_in * Math.sin(endAngle),
      cx + r_in * Math.cos(endAngle - alpha_in * 2),
      cy + r_in * Math.sin(endAngle - alpha_in * 2),
      radiusCorner
    );
    
    ctx.arc(cx, cy, r_in, endAngle - alpha_in, startAngle + alpha_in, true);
    
    ctx.arcTo(
      cx + r_in * Math.cos(startAngle),
      cy + r_in * Math.sin(startAngle),
      cx + d_in * Math.cos(startAngle),
      cy + d_in * Math.sin(startAngle),
      radiusCorner
    );
  } else {
    // Pie slice (no inner radius)
    const halfSweep = sweepAngle / 2;
    let d_in = radiusCorner / Math.sin(halfSweep);
    if (d_in > r_out * 0.4) {
      d_in = r_out * 0.4;
    }
    const t_in = d_in * Math.cos(halfSweep);

    ctx.moveTo(cx + t_in * Math.cos(startAngle), cy + t_in * Math.sin(startAngle));
    
    ctx.arcTo(
      cx + r_out * Math.cos(startAngle),
      cy + r_out * Math.sin(startAngle),
      cx + r_out * Math.cos(startAngle + alpha_out * 2),
      cy + r_out * Math.sin(startAngle + alpha_out * 2),
      radiusCorner
    );
    
    ctx.arc(cx, cy, r_out, startAngle + alpha_out, endAngle - alpha_out);
    
    ctx.arcTo(
      cx + r_out * Math.cos(endAngle),
      cy + r_out * Math.sin(endAngle),
      cx + d_out * Math.cos(endAngle),
      cy + d_out * Math.sin(endAngle),
      radiusCorner
    );
    
    ctx.lineTo(cx + t_in * Math.cos(endAngle), cy + t_in * Math.sin(endAngle));
    
    ctx.arcTo(
      cx,
      cy,
      cx + t_in * Math.cos(startAngle),
      cy + t_in * Math.sin(startAngle),
      radiusCorner
    );
  }
  ctx.closePath();
}
