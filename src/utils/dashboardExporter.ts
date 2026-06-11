import { Chart } from '../chart/Chart';

/**
 * Exports the dashboard grid layout and all child charts into a single Base64 image data URL.
 *
 * @param container The parent dashboard grid container.
 * @param charts List of registered dashboard chart widgets.
 * @param type The image MIME type (e.g. 'image/png').
 * @param options Encoding configuration settings.
 * @returns The Base64 encoded image string, or undefined if no charts exist.
 */
export function exportDashboardToDataURL(
  container: HTMLElement,
  charts: Chart[],
  type = 'image/png',
  options?: any
): string | undefined {
  if (charts.length === 0) return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const dbStyle = window.getComputedStyle(container);
  ctx.fillStyle = dbStyle.backgroundColor || '#f1f5f9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    ctx.save();
    ctx.fillStyle = childStyle.backgroundColor || '#ffffff';
    if (childStyle.boxShadow && childStyle.boxShadow !== 'none') {
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 4;
    }
    if (borderRadius > 0) {
      ctx.beginPath();
      ctx.moveTo(x + borderRadius, y);
      ctx.lineTo(x + w - borderRadius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
      ctx.lineTo(x + w, y + h - borderRadius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - borderRadius, y + h);
      ctx.lineTo(x + borderRadius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
      ctx.lineTo(x, y + borderRadius);
      ctx.quadraticCurveTo(x, y, x + borderRadius, y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();

    const chartCanvas = child.querySelector('canvas') as HTMLCanvasElement;
    if (chartCanvas) {
      ctx.drawImage(
        chartCanvas,
        x + chartCanvas.offsetLeft,
        y + chartCanvas.offsetTop,
        chartCanvas.offsetWidth,
        chartCanvas.offsetHeight
      );
    } else {
      const titleEl = child.querySelector('.card-title') as HTMLElement;
      const valueEl = child.querySelector('.card-value') as HTMLElement;
      if (titleEl && valueEl) {
        ctx.save();
        ctx.fillStyle = window.getComputedStyle(titleEl).color || '#666';
        ctx.font = `bold 12px ${window.getComputedStyle(titleEl).fontFamily || 'sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(titleEl.innerText, x + w / 2, y + h / 2 - 15);

        ctx.fillStyle = window.getComputedStyle(valueEl).color || '#333';
        ctx.font = `bold 32px ${window.getComputedStyle(valueEl).fontFamily || 'sans-serif'}`;
        ctx.fillText(valueEl.innerText, x + w / 2, y + h / 2 + 20);
        ctx.restore();
      }
    }
  });

  return canvas.toDataURL(type, options);
}
