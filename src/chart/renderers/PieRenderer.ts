import { BaseRenderer } from './BaseRenderer';
import { Filter } from '../types';
import { getCanvasColor, drawSketchyArc, drawSketchyLine, truncateText, resolveSize } from './utils/canvasUtils';
import { computeItemOpacity, getColorDef, resolveColorString, isRoundedTheme } from './utils/styleUtils';

/** Renders Pie and Donut charts with optional rounded sectors. */
export class PieRenderer extends BaseRenderer {
  private getLayout() {
    const { width, height, config } = this.context;
    const cx = resolveSize(config.center?.[0], width, width / 2);
    const cy = resolveSize(config.center?.[1], height, height / 2 + 10);

    const maxRefRadius = Math.max(0, Math.min(width, height) / 2);
    const defaultOuter = Math.max(0, Math.min(width * 0.55, height - 90) / 2);
    const isDonut = config.type === 'donut';

    let outerRadius = defaultOuter;
    let innerRadius = isDonut ? defaultOuter * 0.55 : 0;

    if (Array.isArray(config.radius)) {
      innerRadius = resolveSize(config.radius[0], maxRefRadius, innerRadius);
      outerRadius = resolveSize(config.radius[1], maxRefRadius, outerRadius);
    } else if (config.radius !== undefined) {
      outerRadius = resolveSize(config.radius, maxRefRadius, defaultOuter);
      innerRadius = isDonut ? outerRadius * 0.55 : 0;
    }

    return {
      cx,
      cy,
      outerRadius: Math.max(0, outerRadius),
      innerRadius: Math.max(0, Math.min(innerRadius, outerRadius))
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
    const labelItems: {
      tx1: number;
      ty1: number;
      tx2: number;
      labelY: number;
      isRightSide: boolean;
      opacity: number;
      sliceColor: string;
      labelText: string;
    }[] = [];

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
      if (config.showLabels !== false && pct > 0.02) {
        const rTickStart = currentOuterRadius + 2;
        const rTickMid = currentOuterRadius + 12;

        const tx1 = cx + rTickStart * Math.cos(midAngle);
        const ty1 = cy + rTickStart * Math.sin(midAngle);
        const tx2 = cx + rTickMid * Math.cos(midAngle);
        const ty2 = cy + rTickMid * Math.sin(midAngle);
        const isRightSide = Math.cos(midAngle) >= 0;

        const targetVal = targetValues[index] || 0;
        let displayVal = '';
        if (config.asPercentage) {
          const targetTotal = targetValues.reduce((sum, v) => sum + v, 0);
          const targetPct = targetTotal > 0 ? targetVal / targetTotal : 0;
          displayVal = `${(targetPct * 100).toFixed(1)}%`;
        } else {
          displayVal = config.valueFormatter ? config.valueFormatter(targetVal) : String(targetVal);
        }

        const formattedCat = config.labelFormatter ? config.labelFormatter(String(cat)) : String(cat);
        const labelText = `${formattedCat}: ${displayVal}`;

        labelItems.push({
          tx1,
          ty1,
          tx2,
          labelY: ty2,
          isRightSide,
          opacity,
          sliceColor: resolveColorString(colorDef),
          labelText
        });
      }

      startAngle = endAngle;
    });

    const fontSize = config.fontSize || 10;
    if (config.avoidLabelOverlap && labelItems.length > 0) {
      const minGap = fontSize + 4;
      const minY = config.title ? (config.titleFontSize || 14) + 26 : 12;
      const maxY = height - 12;

      [true, false].forEach(side => {
        const sideLabels = labelItems
          .filter(item => item.isRightSide === side)
          .sort((a, b) => a.labelY - b.labelY);

        if (sideLabels.length === 0) return;

        if (sideLabels[0].labelY < minY) {
          sideLabels[0].labelY = minY;
        }
        for (let i = 1; i < sideLabels.length; i++) {
          if (sideLabels[i].labelY < sideLabels[i - 1].labelY + minGap) {
            sideLabels[i].labelY = sideLabels[i - 1].labelY + minGap;
          }
        }
        if (sideLabels[sideLabels.length - 1].labelY > maxY) {
          sideLabels[sideLabels.length - 1].labelY = maxY;
          for (let i = sideLabels.length - 2; i >= 0; i--) {
            if (sideLabels[i].labelY > sideLabels[i + 1].labelY - minGap) {
              sideLabels[i].labelY = Math.max(minY, sideLabels[i + 1].labelY - minGap);
            }
          }
        }
      });
    }

    const tailLen = 8;
    labelItems.forEach(item => {
      ctx.save();
      ctx.globalAlpha = item.opacity;
      ctx.font = `${fontSize}px ${styles.fontFamily || 'sans-serif'}`;
      ctx.fillStyle = styles.textColor;

      const tx3 = item.tx2 + (item.isRightSide ? tailLen : -tailLen);

      ctx.strokeStyle = item.sliceColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(item.tx1, item.ty1);
      ctx.lineTo(item.tx2, item.labelY);
      ctx.lineTo(tx3, item.labelY);
      ctx.stroke();

      ctx.textAlign = item.isRightSide ? 'left' : 'right';
      ctx.textBaseline = 'middle';

      const maxTextWidth = item.isRightSide ? (width - tx3 - 10) : (tx3 - 10);
      if (maxTextWidth > 20) {
        const truncatedLabel = truncateText(ctx, item.labelText, maxTextWidth);
        ctx.fillText(truncatedLabel, tx3 + (item.isRightSide ? 4 : -4), item.labelY);
      }
      ctx.restore();
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
