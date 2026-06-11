import { BaseRenderer } from './BaseRenderer';
import { Filter } from '../types';
import { getCanvasColor, drawSketchyLine, drawSketchyArc, truncateText } from './utils/canvasUtils';
import { getColorDef } from './utils/styleUtils';

/** Renders Radar charts with polygon grids, spokes, and data polygons. */
export class RadarRenderer extends BaseRenderer {
  private getLayout() {
    const { width, height } = this.context;
    const cx = width / 2;
    const cy = height / 2 + 15;
    const maxRadius = Math.max(0, Math.min(width, height - 90) / 2 * 0.75);
    return { cx, cy, maxRadius };
  }

  /** Draws radar grid, spokes, data polygon, and axis labels. */
  render(
    categories: string[],
    ratios: number[],
    _targetValues: number[],
    _yMax: number,
    _animationProgress: number,
    _isFirstRender: boolean,
    hoveredIndex: number | null,
    _activeFilters: Filter[],
    _prevFilters: Filter[]
  ): void {
    const { ctx, width, height, config, theme, styles } = this.context;

    ctx.clearRect(0, 0, width, height);

    if (categories.length === 0) {
      this.renderEmptyState();
      return;
    }

    const { cx, cy, maxRadius } = this.getLayout();
    const count = categories.length;

    ctx.save();
    this.renderTitle();

    // Concentric grid rings
    const levelsCount = 5;
    ctx.strokeStyle = styles.gridLineColor || '#eee';
    ctx.lineWidth = 1;

    if (styles.gridLineType === 'dashed' || styles.gridLineType === 'dotted') {
      ctx.setLineDash([3, 3]);
    } else {
      ctx.setLineDash([]);
    }

    for (let l = 1; l <= levelsCount; l++) {
      const ratio = l / levelsCount;
      const r = maxRadius * ratio;

      if (theme !== 'minimal') {
        ctx.fillStyle = l % 2 === 0 ? 'rgba(0,0,0,0.01)' : 'rgba(0,0,0,0.03)';
        if (theme === 'modern' || theme === 'glass') {
          ctx.fillStyle = l % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)';
        }

        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const px = cx + r * Math.cos(angle);
          const py = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }

      if (theme === 'sketch') {
        for (let i = 0; i < count; i++) {
          const nextIndex = (i + 1) % count;
          const angle1 = (i / count) * Math.PI * 2 - Math.PI / 2;
          const angle2 = (nextIndex / count) * Math.PI * 2 - Math.PI / 2;
          drawSketchyLine(ctx, cx + r * Math.cos(angle1), cy + r * Math.sin(angle1), cx + r * Math.cos(angle2), cy + r * Math.sin(angle2));
        }
      } else {
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const px = cx + r * Math.cos(angle);
          const py = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Spokes and labels
    categories.forEach((cat, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const endX = cx + maxRadius * Math.cos(angle);
      const endY = cy + maxRadius * Math.sin(angle);

      if (theme === 'sketch') {
        ctx.strokeStyle = styles.textColor;
        drawSketchyLine(ctx, cx, cy, endX, endY);
      } else {
        ctx.strokeStyle = styles.gridLineColor || '#eee';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      ctx.fillStyle = styles.textColor;
      ctx.font = `10px ${styles.fontFamily || 'sans-serif'}`;

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const lblX = cx + (maxRadius + 15) * cos;
      const lblY = cy + (maxRadius + 12) * sin;

      if (Math.abs(cos) < 0.1) {
        ctx.textAlign = 'center';
      } else {
        ctx.textAlign = cos > 0 ? 'left' : 'right';
      }

      ctx.textBaseline = 'middle';

      const maxTextWidth = cos > 0 ? (width - lblX - 8) : (lblX - 8);
      const truncatedLabel = truncateText(ctx, String(cat), Math.max(40, maxTextWidth));
      ctx.fillText(truncatedLabel, lblX, lblY);
    });

    const points = categories.map((_, i) => {
       const ratio = ratios[i] || 0;
       const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
       const r = Math.min(ratio, 1.0) * maxRadius;
       return {
         x: cx + r * Math.cos(angle),
         y: cy + r * Math.sin(angle)
       };
     });

    // Data polygon
    const colorDef = getColorDef(0, config, styles);
    const strokeColor = getCanvasColor(ctx, colorDef, cx - maxRadius, cy - maxRadius, maxRadius * 2, maxRadius * 2);

    if (points.length > 0) {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;

      const fillAlpha = theme === 'neon' ? 0.25 : 0.18;
      ctx.fillStyle = typeof strokeColor === 'string' ? strokeColor : 'rgba(99,102,241,0.2)';
      ctx.globalAlpha = fillAlpha;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1.0;
      if (theme === 'sketch') {
        ctx.strokeStyle = styles.textColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < points.length; i++) {
          const next = (i + 1) % points.length;
          drawSketchyLine(ctx, points[i].x, points[i].y, points[next].x, points[next].y);
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();

      // Data point markers
      points.forEach((p, i) => {
        const isHovered = hoveredIndex === i;
        ctx.save();
        ctx.fillStyle = theme === 'sketch' ? '#faf9f6' : '#fff';
        ctx.strokeStyle = theme === 'sketch' ? styles.textColor : strokeColor;
        ctx.lineWidth = 2;

        const size = isHovered ? 6 : 4;
        if (theme === 'sketch') {
          drawSketchyArc(ctx, p.x, p.y, size, 0, Math.PI * 2);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    ctx.restore();
  }

  /** Returns the closest spoke index at the given pixel coordinates. */
  hitTest(
    x: number,
    y: number,
    categories: string[],
    _values: number[]
  ): number | null {
    if (categories.length === 0) return null;

    const { cx, cy, maxRadius } = this.getLayout();
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.hypot(dx, dy);

    if (distance > maxRadius + 25) {
      return null;
    }

    let relativeAngle = Math.atan2(dy, dx) + Math.PI / 2;
    if (relativeAngle < 0) {
      relativeAngle += Math.PI * 2;
    }

    const count = categories.length;
    const sectorSize = (Math.PI * 2) / count;
    let closestIndex = Math.round(relativeAngle / sectorSize) % count;

    return closestIndex;
  }
}
