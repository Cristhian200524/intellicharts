import { BaseRenderer } from './BaseRenderer';
import { Filter } from '../types';

/** Renders KPI text card widgets */
export class CardRenderer extends BaseRenderer {
  render(
    _categories: string[],
    _ratios: number[],
    targetValues: number[],
    _yMax: number,
    animationProgress: number,
    _isFirstRender: boolean,
    _hoveredIndex: number | null,
    _activeFilters: Filter[],
    _prevFilters: Filter[]
  ): void {
    const { ctx, width, height, config, theme, styles } = this.context;

    ctx.clearRect(0, 0, width, height);

    if (targetValues.length === 0) {
      this.renderEmptyState();
      return;
    }

    const totalValue = targetValues.reduce((sum, val) => sum + val, 0);
    const displayValue = config.valueFormatter ? config.valueFormatter(totalValue) : String(totalValue);
    const valueColor = config.colors ? config.colors[0] : styles.cardValueColor;
    const cardFont = (styles.fontFamily ?? 'sans-serif').replace(/"/g, "'");

    // Draw title
    ctx.save();
    ctx.fillStyle = styles.cardTitleColor || '#666';
    const titleSize = Math.max(12, Math.min(16, width * 0.05));
    ctx.font = `600 ${titleSize}px ${cardFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.title || '', width / 2, height / 2 - 18);

    // Draw value
    ctx.fillStyle = valueColor;
    const valueSize = Math.max(24, Math.min(42, width * 0.12));
    ctx.font = `800 ${valueSize}px ${cardFont}`;
    
    if (theme === '3D') {
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    ctx.translate(width / 2, height / 2 + 18);
    const scale = 0.95 + 0.05 * animationProgress;
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.2 + 0.8 * animationProgress;
    ctx.fillText(displayValue, 0, 0);
    ctx.restore();
  }

  hitTest(
    _x: number,
    _y: number,
    _categories: string[],
    _values: number[]
  ): number | null {
    return null;
  }
}
