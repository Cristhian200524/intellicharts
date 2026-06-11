import { ThemeStyles } from '../../themes/themes';

/**
 * Resolves color codes or linear gradients.
 */
export function getCanvasColor(
  ctx: CanvasRenderingContext2D,
  colorDef: any,
  bx: number,
  by: number,
  bw: number,
  bh: number
): string | CanvasGradient {
  if (typeof colorDef === 'string') {
    return colorDef;
  }

  if (colorDef && colorDef.type === 'linear') {
    const x1 = bx + bw * (colorDef.x ?? 0);
    const y1 = by + bh * (colorDef.y ?? 0);
    const x2 = bx + bw * (colorDef.x2 ?? 0);
    const y2 = by + bh * (colorDef.y2 ?? 1);

    try {
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      if (Array.isArray(colorDef.colorStops)) {
        for (const stop of colorDef.colorStops) {
          gradient.addColorStop(stop.offset, stop.color);
        }
      }
      return gradient;
    } catch (e) {
      return '#ccc';
    }
  }

  return '#ccc';
}

/**
 * Draws rounded corners.
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: number | number[]
): void {
  let r = [0, 0, 0, 0];
  if (typeof radii === 'number') {
    r = [radii, radii, radii, radii];
  } else if (Array.isArray(radii)) {
    if (radii.length === 2) {
      r = [radii[0], radii[0], radii[1], radii[1]];
    } else if (radii.length >= 4) {
      r = [radii[0], radii[1], radii[2], radii[3]];
    }
  }

  const minDim = Math.min(w, h);
  r = r.map(val => Math.min(val, minDim / 2));

  ctx.beginPath();
  ctx.moveTo(x + r[0], y);
  ctx.lineTo(x + w - r[1], y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r[1]);
  ctx.lineTo(x + w, y + h - r[2]);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
  ctx.lineTo(x + r[3], y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r[3]);
  ctx.lineTo(x, y + r[0]);
  ctx.quadraticCurveTo(x, y, x + r[0], y);
  ctx.closePath();
}

/**
 * Draws wavy lines.
 */
export function drawSketchyLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const segments = Math.max(2, Math.floor(distance / 15));

  for (let drawCount = 0; drawCount < 2; drawCount++) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      const jitter = (Math.random() - 0.5) * 1.5;
      
      const nx = -(y2 - y1) / distance;
      const ny = (x2 - x1) / distance;
      ctx.lineTo(px + nx * jitter, py + ny * jitter);
    }

    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

/**
 * Draws sketchy rectangles.
 */
export function drawSketchyRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  drawSketchyLine(ctx, x, y, x + w, y);
  drawSketchyLine(ctx, x + w, y, x + w, y + h);
  drawSketchyLine(ctx, x + w, y + h, x, y + h);
  drawSketchyLine(ctx, x, y + h, x, y);
}

/**
 * Draws sketchy arcs.
 */
export function drawSketchyArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): void {
  const angleDiff = Math.abs(endAngle - startAngle);
  const segments = Math.max(8, Math.floor(radius * angleDiff / 5));

  for (let drawCount = 0; drawCount < 2; drawCount++) {
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments);
      const jitter = (Math.random() - 0.5) * 1.2;
      const r = radius + jitter;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
}

/**
 * Truncates text with ellipsis.
 */
export function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  const width = ctx.measureText(text).width;
  if (width <= maxWidth) {
    return text;
  }

  let truncated = text;
  while (truncated.length > 0) {
    truncated = truncated.slice(0, -1);
    const testWidth = ctx.measureText(truncated + '...').width;
    if (testWidth <= maxWidth) {
      return truncated + '...';
    }
  }

  return '...';
}

/**
 * Positions and styles tooltip.
 */
export function updateTooltip(
  tooltipEl: HTMLElement,
  x: number,
  y: number,
  header: string,
  value: string,
  styles: ThemeStyles,
  color: string
): void {
  tooltipEl.style.display = 'block';
  tooltipEl.style.backgroundColor = styles.tooltipBg || 'rgba(255, 255, 255, 0.98)';
  tooltipEl.style.border = `1px solid ${styles.tooltipBorderColor || '#ccc'}`;
  tooltipEl.style.color = styles.tooltipTextColor || '#333';
  tooltipEl.style.borderRadius = '6px';
  tooltipEl.style.padding = '8px 12px';
  tooltipEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  tooltipEl.style.fontFamily = styles.fontFamily || 'sans-serif';
  tooltipEl.style.fontSize = '12px';
  tooltipEl.style.lineHeight = '1.4';
  tooltipEl.style.whiteSpace = 'nowrap';

  let mainValue = value;
  let extraHtml = '';
  const divIndex = value.indexOf('<div');
  if (divIndex >= 0) {
    mainValue = value.substring(0, divIndex);
    extraHtml = value.substring(divIndex);
  }

  tooltipEl.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${header}</div>
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; flex-shrink: 0;"></span>
      <span>${mainValue}</span>
    </div>
    ${extraHtml}
  `;

  const containerWidth = tooltipEl.offsetParent ? (tooltipEl.offsetParent as HTMLElement).offsetWidth : window.innerWidth;
  const containerHeight = tooltipEl.offsetParent ? (tooltipEl.offsetParent as HTMLElement).offsetHeight : window.innerHeight;
  const tooltipWidth = tooltipEl.offsetWidth;
  const tooltipHeight = tooltipEl.offsetHeight;

  let leftPos = x + 15;
  if (leftPos + tooltipWidth > containerWidth) {
    leftPos = x - tooltipWidth - 15;
  }
  if (leftPos < 5) {
    leftPos = 5;
  }

  let topPos = y - tooltipHeight / 2;
  if (topPos < 5) {
    topPos = 5;
  } else if (topPos + tooltipHeight > containerHeight - 5) {
    topPos = Math.max(5, containerHeight - tooltipHeight - 5);
  }

  tooltipEl.style.left = `${leftPos}px`;
  tooltipEl.style.top = `${topPos}px`;
}

/**
 * Generates nice rounded numeric ticks.
 */
export function getNiceTicks(
  min: number,
  max: number,
  tickCount = 5
): { ticks: number[]; max: number } {
  if (max <= 0) {
    return { ticks: [0, 25, 50, 75, 100], max: 100 };
  }
  const range = max - min;
  const rawInterval = range / tickCount;
  const logDim = Math.floor(Math.log10(rawInterval));
  const pow10 = Math.pow(10, logDim);

  const candidates = [1, 2, 5, 10];
  const ratio = rawInterval / pow10;
  let niceRatio = candidates[0];
  for (const c of candidates) {
    if (ratio <= c) {
      niceRatio = c;
      break;
    }
  }
  const interval = niceRatio * pow10;
  const niceMin = Math.floor(min / interval) * interval;
  const niceMax = Math.ceil(max / interval) * interval;

  const ticks: number[] = [];
  for (let val = niceMin; val <= niceMax + 0.0001; val += interval) {
    ticks.push(val);
  }
  return { ticks, max: niceMax };
}

/**
 * Checks if a color is visually dark (using perceived luminance contrast check).
 */
export function isDarkColor(colorDef: any): boolean {
  let colorStr = '#ccc';
  if (typeof colorDef === 'string') {
    colorStr = colorDef;
  } else if (colorDef && colorDef.colorStops && colorDef.colorStops[0]) {
    colorStr = colorDef.colorStops[0].color;
  }

  colorStr = colorStr.trim().toLowerCase();
  let r = 200, g = 200, b = 200;

  if (colorStr.startsWith('#')) {
    const hex = colorStr.substring(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (colorStr.startsWith('rgb')) {
    const parts = colorStr.match(/\d+/g);
    if (parts && parts.length >= 3) {
      r = parseInt(parts[0], 10);
      g = parseInt(parts[1], 10);
      b = parseInt(parts[2], 10);
    }
  } else if (colorStr.startsWith('rgba')) {
    const parts = colorStr.match(/\d+/g);
    if (parts && parts.length >= 4) {
      r = parseInt(parts[0], 10);
      g = parseInt(parts[1], 10);
      b = parseInt(parts[2], 10);
    }
  } else {
    const darkNames = ['black', 'darkgray', 'dimgray', 'navy', 'purple', 'indigo', '#151528', '#0d0c16', '#060b13'];
    if (darkNames.includes(colorStr)) return true;
    const lightNames = ['white', 'lightgray', 'silver', 'yellow', 'cyan', 'lime'];
    if (lightNames.includes(colorStr)) return false;
  }

  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance < 140;
}
