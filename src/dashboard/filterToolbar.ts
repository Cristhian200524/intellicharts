import { Filter } from '../chart/types';
import { THEMES } from '../themes/themes';
import { DashboardConfig } from './types';

/**
 * Injects CSS styles for the dashboard toolbar element and its inner filter chips.
 */
function injectToolbarStyles() {
  if (typeof document === 'undefined' || document.getElementById('intellicharts-toolbar-styles')) return;
  const style = document.createElement('style');
  style.id = 'intellicharts-toolbar-styles';
  style.innerHTML = `
    .dashboard-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
      transition: all 0.3s ease;
    }
    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      font-size: 11.5px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .filter-chip-close {
      cursor: pointer;
      font-weight: bold;
      font-size: 10px;
      margin-left: 2px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      transition: all 0.2s ease;
      opacity: 0.65;
    }
    .filter-chip-close:hover {
      opacity: 1;
      background-color: rgba(255, 255, 255, 0.2);
    }
    .clear-all-btn {
      background: transparent;
      padding: 4px 10px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .clear-all-btn:hover {
      opacity: 0.85;
      background-color: rgba(128, 128, 128, 0.1);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Renders the active filters toolbar at the top of the dashboard.
 *
 * @param container The parent grid layout container element.
 * @param config Dashboard layout and theme configurations.
 * @param activeFilters Currently applied global filters.
 * @param toolbarEl The existing toolbar element, if any.
 * @param onRemoveFilter Callback triggered when a specific filter is removed.
 * @param onClearFilters Callback triggered when all filters are cleared.
 * @returns The rendered toolbar element.
 */
export function renderDashboardToolbar(
  container: HTMLElement,
  config: DashboardConfig,
  activeFilters: Filter[],
  toolbarEl: HTMLElement | undefined,
  onRemoveFilter: (field: string) => void,
  onClearFilters: () => void
): HTMLElement | undefined {
  if (config.showFilterToolbar === false) {
    if (toolbarEl && container.contains(toolbarEl)) {
      container.removeChild(toolbarEl);
    }
    return undefined;
  }

  let el = toolbarEl;
  if (!el || !container.contains(el)) {
    el = document.createElement('div');
    el.className = 'dashboard-toolbar';
    el.style.gridColumn = '1 / -1';
    el.style.boxSizing = 'border-box';
    container.prepend(el);
  }

  if (activeFilters.length === 0) {
    el.style.display = 'none';
    return el;
  }

  injectToolbarStyles();

  const themeName = config.theme ?? 'common';
  const styles = THEMES[themeName];

  const rawColor = styles.chartColors[0];
  const themeColor = typeof rawColor === 'string' ? rawColor : (rawColor?.colorStops?.[0]?.color ?? '#6366f1');

  const isDark = ['modern', 'glass', 'elegant', 'neon'].includes(themeName);
  const colors = themeColor.startsWith('#')
    ? { bg: themeColor + '15', border: themeColor + '40', text: themeColor }
    : {
        bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        border: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        text: isDark ? '#ffffff' : '#1f2937'
      };

  el.style.display = 'flex';
  el.style.padding = themeName === 'minimal' ? '8px 0px' : '10px 16px';
  el.style.background = styles.containerBackground;
  el.style.border = styles.containerBorder;
  el.style.borderRadius = styles.containerBorderRadius;
  el.style.boxShadow = styles.containerBoxShadow;
  el.style.color = styles.textColor;
  el.style.fontFamily = styles.fontFamily ?? 'sans-serif';

  if (themeName === 'minimal') {
    el.style.border = 'none';
    el.style.borderBottom = '1px solid #e5e5e5';
    el.style.borderRadius = '0';
  }

  if (styles.containerBackdropFilter) {
    el.style.backdropFilter = styles.containerBackdropFilter;
    (el.style as any).webkitBackdropFilter = styles.containerBackdropFilter;
  } else {
    el.style.backdropFilter = 'none';
    (el.style as any).webkitBackdropFilter = 'none';
  }

  el.innerHTML = '';

  const leftContainer = document.createElement('div');
  leftContainer.style.display = 'flex';
  leftContainer.style.alignItems = 'center';
  leftContainer.style.gap = '10px';
  leftContainer.style.flexWrap = 'wrap';

  // SVG Funnel Icon
  const iconWrapper = document.createElement('span');
  iconWrapper.style.display = 'inline-flex';
  iconWrapper.style.alignItems = 'center';
  iconWrapper.style.color = themeColor;
  iconWrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`;
  leftContainer.appendChild(iconWrapper);

  const label = document.createElement('span');
  label.innerText = 'Active Filters:';
  label.style.fontWeight = '600';
  label.style.fontSize = '12px';
  label.style.textTransform = 'uppercase';
  label.style.letterSpacing = '0.5px';
  label.style.opacity = '0.85';
  leftContainer.appendChild(label);

  activeFilters.forEach(filter => {
    const pill = document.createElement('div');
    pill.className = 'filter-chip';
    pill.style.background = colors.bg;
    pill.style.border = `1px solid ${colors.border}`;
    pill.style.color = colors.text;
    pill.style.borderRadius = themeName === 'sketch' ? '4px' : '999px';
    pill.style.boxShadow = themeName === 'sketch' ? '2px 2px 0px #2b2b2b' : 'none';

    const text = document.createElement('span');
    const valStr = Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value);
    text.innerHTML = `<span style="opacity: 0.75; font-weight: 500;">${filter.field}:</span> <span style="font-weight: 600;">${valStr}</span>`;
    pill.appendChild(text);

    const closeBtn = document.createElement('span');
    closeBtn.className = 'filter-chip-close';
    closeBtn.innerText = '✕';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      onRemoveFilter(filter.field);
    };
    pill.appendChild(closeBtn);
    leftContainer.appendChild(pill);
  });

  el.appendChild(leftContainer);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'clear-all-btn';
  clearBtn.innerText = 'Clear All';
  clearBtn.style.border = themeName === 'sketch' ? '2px solid #2b2b2b'
                          : themeName === 'minimal' ? 'none'
                          : `1px solid ${colors.border}`;
  clearBtn.style.color = themeName === 'sketch' ? '#2b2b2b'
                         : themeName === 'minimal' ? '#737373'
                         : themeColor;
  clearBtn.style.borderRadius = themeName === 'sketch' ? '4px' : '6px';

  if (themeName === 'minimal') {
    clearBtn.style.textDecoration = 'underline';
    clearBtn.style.textUnderlineOffset = '2px';
  }
  clearBtn.onclick = () => onClearFilters();

  el.appendChild(clearBtn);

  return el;
}
