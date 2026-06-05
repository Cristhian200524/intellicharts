import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { Dashboard as IntelliDashboard } from './dashboard/Dashboard';
import { DashboardConfig } from './dashboard/types';
import { Chart as IntelliCharts } from './chart/Chart';
import { ChartConfig } from './chart/types';
import { ChartTheme } from './theme';
import { autogenerate as intelliAutogenerate, DataType } from './autogenerate';


/**
 * Shared context holding the parent Dashboard instance.
 */
const DashboardContext = React.createContext<IntelliDashboard | null>(null);

/**
 * Properties for the Dashboard React wrapper.
 */
export interface DashboardProps extends DashboardConfig {
  /** Array of raw objects or CSV string representing the global dataset */
  data: any[] | string;
  /** React children components containing Charts */
  children?: ReactNode;
  /** Optional custom CSS class for styling the container */
  className?: string;
  /** Optional custom inline CSS styles */
  style?: React.CSSProperties;
}

/**
 * React Component wrapper for the IntelliCharts Dashboard.
 */
export const Dashboard: React.FC<DashboardProps> = ({ data, children, className, style, ...config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dashboard, setDashboard] = useState<IntelliDashboard | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    let db: IntelliDashboard | null = null;
    if (containerRef.current && !initialized.current) {
      db = new IntelliDashboard(containerRef.current, config);
      setDashboard(db);
      initialized.current = true;
    }
    return () => {
      if (db) {
        db.dispose();
        initialized.current = false;
      }
    };
  }, [config]);

  useEffect(() => {
    if (dashboard && data) {
      dashboard.setData(data);
    }
  }, [dashboard, data]);

  return (
    <div ref={containerRef} className={className} style={style}>
      {dashboard && (
        <DashboardContext.Provider value={dashboard}>
          {children}
        </DashboardContext.Provider>
      )}
    </div>
  );
};

/**
 * Properties for the Chart React wrapper.
 */
export interface ChartProps extends ChartConfig {
  /** Array of raw objects or CSV string representing local data when used outside a dashboard */
  data?: any[] | string;
  /** Optional custom CSS class for styling the container */
  className?: string;
  /** Optional custom inline CSS styles */
  style?: React.CSSProperties;
}

/**
 * React Component wrapper for the IntelliCharts Chart.
 */
export const Chart: React.FC<ChartProps> = ({ data, className, style, ...config }) => {
  const dashboard = React.useContext(DashboardContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IntelliCharts | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    let chart: IntelliCharts | null = null;
    if (dashboard && !initialized.current) {
      chart = new IntelliCharts(config);
      dashboard.addChart(chart);
      initialized.current = true;
    } else if (!dashboard && containerRef.current && !initialized.current) {
      chart = new IntelliCharts(config);
      chart.mount(containerRef.current);
      chartInstance.current = chart;
      if (data) {
        chart.render(data);
      }
      initialized.current = true;
    }

    return () => {
      if (chart && dashboard) {
        dashboard.removeChart(chart);
      } else if (chartInstance.current && !dashboard) {
        chartInstance.current.dispose();
      }
      initialized.current = false;
    };
  }, [dashboard, config]);

  useEffect(() => {
    if (!dashboard && chartInstance.current && data) {
      chartInstance.current.render(data);
    }
  }, [dashboard, data]);

  if (dashboard) {
    return null;
  }

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '300px', ...style }} />;
};

/**
 * Properties for the AutoDashboard React component wrapper.
 */
export interface AutoDashboardProps {
  /** Array of raw objects or CSV string representing the dataset */
  data: any[] | string;
  /** Optional schema overrides to explicitly specify DataTypes for columns */
  schema?: Record<string, DataType>;
  /** Default visual theme applied to children charts */
  theme?: ChartTheme;
  /** Maximum number of grid columns on desktop layouts */
  columns?: number;
  /** Gap space between grid items (e.g., '20px') */
  gap?: string;
  /** Base height spanned by a single grid row */
  rowHeight?: string;
  /** Optional custom CSS class for styling the container */
  className?: string;
  /** Optional custom inline CSS styles */
  style?: React.CSSProperties;
}

/**
 * React Component that automatically generates and renders a complete dashboard layout.
 */
export const AutoDashboard: React.FC<AutoDashboardProps> = ({
  data,
  schema,
  theme,
  columns,
  gap,
  rowHeight,
  className,
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dashboardInstance = useRef<IntelliDashboard | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const db = intelliAutogenerate(
        containerRef.current,
        data,
        schema,
        { theme, columns, gap, rowHeight }
      );
      dashboardInstance.current = db;

      return () => {
        if (dashboardInstance.current) {
          dashboardInstance.current.removeAllCharts();
        }
      };
    }
  }, [data, schema, theme, columns, gap, rowHeight]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', minHeight: '500px', ...style }}
    />
  );
};

