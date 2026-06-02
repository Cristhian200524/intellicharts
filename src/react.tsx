import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { Dashboard as IntelliDashboard, DashboardConfig } from './Dashboard';
import { Chart as IntelliCharts, ChartConfig } from './Chart';

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
    if (containerRef.current && !initialized.current) {
      const db = new IntelliDashboard(containerRef.current, config);
      setDashboard(db);
      initialized.current = true;
    }
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
    if (dashboard && !initialized.current) {
      const chart = new IntelliCharts(config);
      dashboard.addChart(chart);
      initialized.current = true;
    } else if (!dashboard && containerRef.current && !initialized.current) {
      const chart = new IntelliCharts(config);
      chart.mount(containerRef.current);
      chartInstance.current = chart;
      if (data) {
        chart.render(data);
      }
      initialized.current = true;
    }
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
