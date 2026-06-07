/**
 * Supported theme names in the library.
 */
export type ChartTheme = 'minimal' | 'common' | 'modern' | '3D' | 'glass' | 'elegant' | 'neon' | 'sketch';

/**
 * Styling options for a visual theme.
 */
export interface ThemeStyles {
  /** CSS background property value for the card container (e.g. colors, linear-gradient) */
  containerBackground: string;
  /** CSS border property value for the card container */
  containerBorder: string;
  /** CSS border-radius property value for card rounded corners */
  containerBorderRadius: string;
  /** CSS box-shadow property value for card elevation shadow */
  containerBoxShadow: string;
  /** CSS backdrop-filter property value for glassy frosted layouts */
  containerBackdropFilter?: string;
  /** CSS transition property value for hover animation durations */
  containerTransition: string;
  /** CSS box-shadow override triggered on mouse hover */
  containerHoverBoxShadow?: string;
  /** CSS transform override triggered on mouse hover (e.g. translations, scales) */
  containerHoverTransform?: string;
  /** CSS border override triggered on mouse hover */
  containerHoverBorder?: string;
  /** CSS title color applied to KPI text card widgets */
  cardTitleColor: string;
  /** CSS numerical value color applied to KPI text card widgets */
  cardValueColor: string;
  /** Array of hex colors or linear gradient definitions cycled by chart series */
  chartColors: any[];
  /** Default typography color used for labels, legend, and axis texts */
  textColor: string;
  /** Default font family used in chart texts */
  fontFamily?: string;
  /** Color applied to internal grid split lines */
  gridLineColor: string;
  /** Stroke pattern used for internal grid split lines */
  gridLineType: 'solid' | 'dashed' | 'dotted';
  /** Color applied to x/y axis boundary lines */
  axisLineColor: string;
  /** Background color applied to tooltips */
  tooltipBg: string;
  /** Border color applied to tooltips */
  tooltipBorderColor: string;
  /** Typography color applied to tooltip text content */
  tooltipTextColor: string;
  /** Theme-specific itemStyle overrides merged directly into bar series */
  extraBarItemStyle?: any;
  /** Theme-specific lineStyle overrides merged directly into line series */
  extraLineStyle?: any;
  /** Theme-specific areaStyle gradient overlays merged directly into line series */
  extraAreaStyle?: any;
  /** Theme-specific itemStyle overrides merged directly into pie series */
  extraPieItemStyle?: any;
  /** Theme-specific itemStyle overrides merged directly into funnel series */
  extraFunnelItemStyle?: any;
  /** Theme-specific symbol and itemStyle overrides merged directly into line series */
  extraLineSymbolStyle?: any;
  /** Theme-specific symbol, line, and area overrides merged directly into radar series data items */
  extraRadarStyle?: any;
  /** CSS background property value for the parent dashboard grid container */
  dashboardBackground?: string;
  /** CSS text color property value for the parent dashboard grid container */
  dashboardTextColor?: string;
}

/**
 * Visual specifications registry for all premium themes.
 */
export const THEMES: Record<ChartTheme, ThemeStyles> = {
  common: {
    containerBackground: '#ffffff',
    containerBorder: 'none',
    containerBorderRadius: '8px',
    containerBoxShadow: '0 4px 6px rgba(0,0,0,0.08)',
    containerTransition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    containerHoverBoxShadow: '0 10px 20px rgba(0,0,0,0.12)',
    containerHoverTransform: 'translateY(-2px)',
    cardTitleColor: '#666666',
    cardValueColor: '#333333',
    chartColors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
    textColor: '#333333',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    gridLineColor: '#eeeeee',
    gridLineType: 'solid',
    axisLineColor: '#333333',
    tooltipBg: 'rgba(255, 255, 255, 0.98)',
    tooltipBorderColor: '#ccc',
    tooltipTextColor: '#333',
    dashboardBackground: '#f1f5f9',
    dashboardTextColor: '#0f172a'
  },
  minimal: {
    containerBackground: '#fafafa',
    containerBorder: '1px solid #e5e5e5',
    containerBorderRadius: '4px',
    containerBoxShadow: 'none',
    containerTransition: 'all 0.2s ease-in-out',
    containerHoverBorder: '1px solid #a3a3a3',
    containerHoverBoxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    containerHoverTransform: 'none',
    cardTitleColor: '#777777',
    cardValueColor: '#1a1a1a',
    chartColors: ['#242424', '#555555', '#888888', '#aaaaaa', '#cccccc'],
    textColor: '#242424',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    gridLineColor: '#f0f0f0',
    gridLineType: 'dashed',
    axisLineColor: '#b5b5b5',
    tooltipBg: '#ffffff',
    tooltipBorderColor: '#e5e5e5',
    tooltipTextColor: '#242424',
    dashboardBackground: '#fafafa',
    dashboardTextColor: '#18181b'
  },
  modern: {
    containerBackground: 'linear-gradient(135deg, #1f1f35 0%, #151528 100%)',
    containerBorder: '1px solid rgba(255, 255, 255, 0.08)',
    containerBorderRadius: '16px',
    containerBoxShadow: '0 12px 24px rgba(0,0,0,0.3)',
    containerTransition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    containerHoverBoxShadow: '0 16px 32px rgba(99, 102, 241, 0.3)',
    containerHoverTransform: 'translateY(-4px) scale(1.01)',
    cardTitleColor: '#94a3b8',
    cardValueColor: '#ffffff',
    chartColors: [
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#4f46e5' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#a855f7' }, { offset: 1, color: '#7c3aed' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#ec4899' }, { offset: 1, color: '#db2777' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1d4ed8' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#14b8a6' }, { offset: 1, color: '#0f766e' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#d97706' }]
      }
    ],
    textColor: '#e2e8f0',
    fontFamily: 'Outfit, Poppins, Inter, system-ui, sans-serif',
    gridLineColor: 'rgba(255, 255, 255, 0.05)',
    gridLineType: 'solid',
    axisLineColor: '#64748b',
    tooltipBg: 'rgba(15, 23, 42, 0.95)',
    tooltipBorderColor: '#6366f1',
    tooltipTextColor: '#f8fafc',
    extraBarItemStyle: {
      borderRadius: [6, 6, 0, 0]
    },
    extraLineStyle: {
      smooth: false,
      width: 3
    },
    extraAreaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(99, 102, 241, 0.4)' },
          { offset: 1, color: 'rgba(99, 102, 241, 0.01)' }
        ]
      }
    },
    dashboardBackground: '#0f0f1c',
    dashboardTextColor: '#f1f5f9'
  },
  '3D': {
    containerBackground: '#e2e8f0',
    containerBorder: 'none',
    containerBorderRadius: '16px',
    containerBoxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.7), inset -2px -2px 5px rgba(0,0,0,0.05), 6px 6px 16px rgba(163,177,198,0.6), -6px -6px 16px rgba(255,255,255,0.8)',
    containerTransition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    containerHoverBoxShadow: 'inset 1px 1px 3px rgba(255,255,255,0.7), inset -1px -1px 3px rgba(0,0,0,0.05), 10px 10px 24px rgba(163,177,198,0.7), -10px -10px 24px rgba(255,255,255,0.9)',
    containerHoverTransform: 'translateY(-4px)',
    cardTitleColor: '#4a5568',
    cardValueColor: '#2b6cb0',
    chartColors: [
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#63b3ed' }, { offset: 1, color: '#3182ce' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#4fd1c5' }, { offset: 1, color: '#319795' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#f6ad55' }, { offset: 1, color: '#dd6b20' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#fc8181' }, { offset: 1, color: '#e53e3e' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#b779f1' }, { offset: 1, color: '#805ad5' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#f6e05e' }, { offset: 1, color: '#d69e2e' }]
      }
    ],
    textColor: '#2d3748',
    fontFamily: 'Montserrat, system-ui, -apple-system, sans-serif',
    gridLineColor: '#cbd5e0',
    gridLineType: 'solid',
    axisLineColor: '#4a5568',
    tooltipBg: '#e2e8f0',
    tooltipBorderColor: '#cbd5e0',
    tooltipTextColor: '#2d3748',
    extraBarItemStyle: {
      borderRadius: [8, 8, 0, 0],
      shadowColor: 'rgba(0,0,0,0.22)',
      shadowBlur: 8,
      shadowOffsetX: 2,
      shadowOffsetY: 4
    },
    dashboardBackground: '#e2e8f0',
    dashboardTextColor: '#1e293b'
  },
  glass: {
    containerBackground: 'rgba(255, 255, 255, 0.08)',
    containerBorder: '1px solid rgba(255, 255, 255, 0.15)',
    containerBorderRadius: '16px',
    containerBoxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
    containerBackdropFilter: 'blur(16px) saturate(140%)',
    containerTransition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    containerHoverBoxShadow: '0 12px 40px 0 rgba(255, 255, 255, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
    containerHoverTransform: 'translateY(-2px)',
    cardTitleColor: 'rgba(255, 255, 255, 0.7)',
    cardValueColor: '#ffffff',
    chartColors: [
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(255, 121, 198, 0.85)' }, { offset: 1, color: 'rgba(255, 121, 198, 0.3)' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(139, 233, 253, 0.85)' }, { offset: 1, color: 'rgba(139, 233, 253, 0.3)' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(80, 250, 123, 0.85)' }, { offset: 1, color: 'rgba(80, 250, 123, 0.3)' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(255, 184, 108, 0.85)' }, { offset: 1, color: 'rgba(255, 184, 108, 0.3)' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(189, 147, 249, 0.85)' }, { offset: 1, color: 'rgba(189, 147, 249, 0.3)' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(255, 85, 85, 0.85)' }, { offset: 1, color: 'rgba(255, 85, 85, 0.3)' }]
      }
    ],
    textColor: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Plus Jakarta Sans, Poppins, system-ui, -apple-system, sans-serif',
    gridLineColor: 'rgba(255, 255, 255, 0.06)',
    gridLineType: 'dashed',
    axisLineColor: 'rgba(255, 255, 255, 0.4)',
    tooltipBg: 'rgba(20, 20, 35, 0.85)',
    tooltipBorderColor: 'rgba(255, 255, 255, 0.2)',
    tooltipTextColor: '#ffffff',
    extraBarItemStyle: {
      borderRadius: [4, 4, 0, 0],
      opacity: 0.85
    },
    dashboardBackground: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
    dashboardTextColor: 'rgba(255, 255, 255, 0.9)'
  },
  elegant: {
    containerBackground: 'linear-gradient(135deg, #0e1626 0%, #060b13 100%)',
    containerBorder: '1px solid rgba(212, 175, 55, 0.25)',
    containerBorderRadius: '12px',
    containerBoxShadow: '0 15px 35px rgba(0,0,0,0.5)',
    containerTransition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
    containerHoverBoxShadow: '0 20px 40px rgba(212, 175, 55, 0.15)',
    containerHoverTransform: 'translateY(-3px)',
    cardTitleColor: '#c5a059',
    cardValueColor: '#f3e7c4',
    chartColors: [
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#e5c060' }, { offset: 1, color: '#b89438' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#3c6e71' }, { offset: 1, color: '#284b63' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#8e7f67' }, { offset: 1, color: '#564d3d' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#b23a48' }, { offset: 1, color: '#8c1c28' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#4a5759' }, { offset: 1, color: '#333d40' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#d4af37' }, { offset: 1, color: '#aa7c11' }]
      }
    ],
    textColor: '#f3e7c4',
    fontFamily: '"Playfair Display", Georgia, serif',
    gridLineColor: 'rgba(212, 175, 55, 0.08)',
    gridLineType: 'solid',
    axisLineColor: '#c5a059',
    tooltipBg: 'rgba(14, 22, 38, 0.95)',
    tooltipBorderColor: '#d4af37',
    tooltipTextColor: '#f3e7c4',
    extraBarItemStyle: {
      borderRadius: [2, 2, 0, 0],
      borderColor: 'rgba(212, 175, 55, 0.4)',
      borderWidth: 1
    },
    dashboardBackground: '#070c14',
    dashboardTextColor: '#f1e7d0'
  },
  neon: {
    containerBackground: 'rgba(13, 12, 22, 0.75)',
    containerBorder: '1px solid rgba(0, 242, 254, 0.15)',
    containerBorderRadius: '12px',
    containerBoxShadow: '0 8px 32px 0 rgba(0, 242, 254, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.02)',
    containerTransition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    containerHoverBoxShadow: '0 0 20px 0 rgba(255, 0, 127, 0.35), 0 8px 32px 0 rgba(0, 242, 254, 0.15)',
    containerHoverBorder: '1px solid rgba(255, 0, 127, 0.5)',
    containerHoverTransform: 'translateY(-2px)',
    cardTitleColor: '#00f2fe',
    cardValueColor: '#ff007f',
    chartColors: [
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#00f2fe' }, { offset: 1, color: '#4facfe' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#ff007f' }, { offset: 1, color: '#7f00ff' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#39ff14' }, { offset: 1, color: '#00ff87' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#ff00f0' }, { offset: 1, color: '#ff007f' }]
      },
      {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: '#ffb300' }, { offset: 1, color: '#ff3d00' }]
      }
    ],
    textColor: '#e0e6ed',
    fontFamily: 'Outfit, Poppins, Inter, system-ui, sans-serif',
    gridLineColor: 'rgba(0, 242, 254, 0.05)',
    gridLineType: 'dashed',
    axisLineColor: 'rgba(0, 242, 254, 0.4)',
    tooltipBg: 'rgba(10, 8, 20, 0.95)',
    tooltipBorderColor: '#ff007f',
    tooltipTextColor: '#ffffff',
    extraBarItemStyle: {
      borderRadius: [4, 4, 0, 0],
      shadowBlur: 8,
      shadowColor: 'rgba(0, 242, 254, 0.2)'
    },
    extraLineStyle: {
      smooth: true,
      width: 3
    },
    dashboardBackground: 'linear-gradient(135deg, #0a0813 0%, #05040a 100%)',
    dashboardTextColor: '#e2e8f0'
  },
  sketch: {
    containerBackground: '#faf9f6',
    containerBorder: '2px solid #2b2b2b',
    containerBorderRadius: '8px',
    containerBoxShadow: '4px 4px 0px #2b2b2b',
    containerTransition: 'all 0.2s ease-in-out',
    containerHoverBoxShadow: '6px 6px 0px #2b2b2b',
    containerHoverTransform: 'translate(-2px, -2px)',
    containerHoverBorder: '2px solid #1a1a1a',
    cardTitleColor: '#4a4a4a',
    cardValueColor: '#2b2b2b',
    chartColors: ['#3182ce', '#e53e3e', '#38a169', '#dd6b20', '#805ad5', '#319795'],
    textColor: '#2b2b2b',
    fontFamily: '"Architects Daughter", "Kalam", "Comic Sans MS", cursive',
    gridLineColor: '#cbd5e0',
    gridLineType: 'dashed',
    axisLineColor: '#2b2b2b',
    tooltipBg: '#faf9f6',
    tooltipBorderColor: '#2b2b2b',
    tooltipTextColor: '#2b2b2b',
    extraBarItemStyle: {
      borderColor: '#2b2b2b',
      borderWidth: 2,
      shadowBlur: 0,
      shadowColor: '#2b2b2b',
      shadowOffsetX: 2,
      shadowOffsetY: 2
    },
    extraLineStyle: {
      smooth: true,
      width: 3
    },
    extraPieItemStyle: {
      borderRadius: 4,
      borderColor: '#2b2b2b',
      borderWidth: 2,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      shadowBlur: 0,
      shadowColor: '#2b2b2b'
    },
    extraFunnelItemStyle: {
      borderRadius: 4,
      borderColor: '#2b2b2b',
      borderWidth: 2,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      shadowBlur: 0,
      shadowColor: '#2b2b2b'
    },
    extraLineSymbolStyle: {
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        borderWidth: 2,
        borderColor: '#2b2b2b'
      }
    },
    extraRadarStyle: {
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        borderWidth: 2,
        borderColor: '#2b2b2b'
      },
      lineStyle: {
        width: 3
      },
      areaStyle: {
        opacity: 0.15
      }
    },
    dashboardBackground: '#f5f2eb',
    dashboardTextColor: '#2b2b2b'
  }
};
