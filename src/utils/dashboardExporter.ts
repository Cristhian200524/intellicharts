import { Chart } from '../chart/Chart';

/**
 * Draws background with linear gradient, backdrop filter, and borders using native roundRect.
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  borderRadius: number,
  computedStyle: CSSStyleDeclaration,
  fallbackColor: string,
  dpr: number
) {
  let bg = computedStyle.backgroundImage !== 'none' ? computedStyle.backgroundImage : computedStyle.backgroundColor;
  if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') bg = fallbackColor;

  // 1. Simulate backdrop filter (frosted glass blur)
  const filter = computedStyle.backdropFilter || (computedStyle as any).webkitBackdropFilter;
  if (filter && filter.includes('blur')) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, borderRadius) : ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.filter = filter.match(/blur\([^)]+\)/)?.[0] || 'none';
    ctx.drawImage(ctx.canvas, 0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr);
    ctx.restore();
  }

  // 2. Draw card background (solid or gradient)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, borderRadius) : ctx.rect(x, y, w, h);
  ctx.clip();

  if (bg.includes('linear-gradient')) {
    const colors = bg.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g) || [fallbackColor, fallbackColor];
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = bg;
  }
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // 3. Draw borders
  const bw = parseFloat(computedStyle.borderWidth) || 0;
  if (bw > 0 && computedStyle.borderColor && computedStyle.borderStyle !== 'none') {
    ctx.save();
    ctx.lineWidth = bw;
    ctx.strokeStyle = computedStyle.borderColor;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, borderRadius) : ctx.rect(x, y, w, h);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Exports the dashboard grid layout and all child charts into a single Base64 image data URL.
 */
export function exportDashboardToDataURL(
  container: HTMLElement,
  charts: Chart[],
  type = 'image/png',
  options?: any
): string | undefined {
  if (charts.length === 0) return undefined;

  const prevProgresses = charts.map(chart => chart.getCurrentAnimationProgress());
  charts.forEach(chart => chart.forceFinalFrame());

  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = container.offsetWidth * dpr;
  canvas.height = container.offsetHeight * dpr;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    charts.forEach((chart, idx) => {
      const prev = prevProgresses[idx];
      if (prev < 1.0) chart.restoreFrame(prev);
    });
    return undefined;
  }

  ctx.scale(dpr, dpr);

  const dbStyle = window.getComputedStyle(container);
  drawBackground(ctx, 0, 0, container.offsetWidth, container.offsetHeight, 0, dbStyle, '#f1f5f9', dpr);

  charts.forEach(chart => {
    const child = chart.getContainer();
    if (!child) return;
    const parentRect = container.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();
    const x = childRect.left - parentRect.left;
    const y = childRect.top - parentRect.top;
    const w = childRect.width;
    const h = childRect.height;

    const childStyle = window.getComputedStyle(child);
    const borderRadius = parseFloat(childStyle.borderRadius) || 0;

    // Draw shadow/glow (Neon/Glass glow)
    const shadowColor = childStyle.boxShadow.match(/rgba?\([^)]+\)|#[0-9a-fA-F]+/)?.[0];
    if (shadowColor && shadowColor !== 'transparent' && !childStyle.boxShadow.includes('inset')) {
      ctx.save();
      ctx.shadowColor = shadowColor;
      const pxs = childStyle.boxShadow.replace(shadowColor, '').match(/-?\d+px/g)?.map(p => parseFloat(p)) || [];
      ctx.shadowOffsetX = pxs[0] || 0;
      ctx.shadowOffsetY = pxs[1] || 0;
      ctx.shadowBlur = pxs[2] || 0;
      ctx.fillStyle = '#000000';
      
      const drawPath = () => {
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, w, h, borderRadius) : ctx.rect(x, y, w, h);
        ctx.fill();
      };
      
      drawPath();
      
      // Cut out card interior to preserve transparency
      ctx.shadowColor = 'transparent';
      ctx.globalCompositeOperation = 'destination-out';
      drawPath();
      ctx.restore();
    }

    drawBackground(ctx, x, y, w, h, borderRadius, childStyle, '#ffffff', dpr);

    const chartCanvas = child.querySelector('canvas') as HTMLCanvasElement;
    if (chartCanvas) {
      ctx.drawImage(chartCanvas, x + chartCanvas.offsetLeft, y + chartCanvas.offsetTop, chartCanvas.offsetWidth, chartCanvas.offsetHeight);
    }
  });

  const dataURL = canvas.toDataURL(type, options);

  charts.forEach((chart, index) => {
    const prev = prevProgresses[index];
    if (prev < 1.0) chart.restoreFrame(prev);
  });

  return dataURL;
}
