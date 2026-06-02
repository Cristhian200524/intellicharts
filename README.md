# IntelliCharts

IntelliCharts is a library for creating interactive dashboards. It connects multiple charts to the same dataset so they can interact with each other automatically.

## Key Features

| Feature / Function | What does it do? |
| :--- | :--- |
| **Cross-filtering** | Clicking any bar, line, or pie slice on a chart automatically filters all other charts in the dashboard to show only the information related to that category. |
| **Responsive Grid** | Automatically arranges charts in a grid that adapts to the screen size. It formats for desktops (multi-column), tablets (2 columns), and mobile phones (1 column). |
| **KPI Metric Cards** | Displays key metrics or accumulated totals in plain text cards. It automatically adjusts font sizes and truncates long titles with "..." to prevent layout overflows. |
| **Automatic Percentages** | Optionally converts chart values into percentages calculated dynamically against the currently filtered total. |
| **Built-in Themes** | Features 6 visual styles (`common`, `minimal`, `modern`, `3D`, `glass`, `elegant`) that set backgrounds, borders, colors, shadows, and fonts globally or individually. |
| **React Support** | Provides declarative components ready to use in React projects. |

## Installation

```bash
npm install intellicharts echarts
```

## Vanilla JS Usage

Create a container in HTML:

```html
<div id="dashboard-root"></div>
```

Initialize the dashboard and charts in your code:

```typescript
import { Dashboard, Chart } from 'intellicharts';

const data = [
  { category: 'Electronics', region: 'North', sales: 1500 },
  { category: 'Clothing', region: 'North', sales: 600 }
];

// 1. Create the dashboard
const dashboard = new Dashboard(document.getElementById('dashboard-root')!, {
  columns: 4,
  gap: '20px',
  rowHeight: '140px',
  theme: 'common' // Optional theme
});

// 2. Define your charts
const kpiCard = new Chart({
  type: 'card',
  dimension: 'category',
  measure: 'sales',
  title: 'Total Sales',
  column: 4, 
  heightRows: 1
});

const barChart = new Chart({
  type: 'bar',
  dimension: 'region',
  measure: 'sales',
  title: 'Sales by Region',
  asPercentage: true,
  column: 2, 
  heightRows: 2
});

// 3. Add charts to the dashboard and load data
dashboard.addChart(kpiCard);
dashboard.addChart(barChart);
dashboard.setData(data);
```

### Loading CSV Data

IntelliCharts can natively parse and load CSV data. Instead of arrays of objects, you can pass a CSV string directly to `setData()`. The library automatically parses headers, rows, and converts numeric values:

```typescript
const csvData = `category,region,sales
Electronics,North,1500
Clothing,North,600`;

dashboard.setData(csvData);
```

## React Usage

```tsx
import { Dashboard, Chart } from 'intellicharts/react';

export default function App() {
  const data = [
    { category: 'Electronics', region: 'North', sales: 1500 },
    { category: 'Clothing', region: 'North', sales: 600 }
  ];

  return (
    <Dashboard data={data} columns={4} gap="20px" rowHeight="140px">
      <Chart 
        type="card" 
        dimension="category" 
        measure="sales" 
        title="Total Sales" 
        column={4} 
        heightRows={1} 
      />
      <Chart 
        type="bar" 
        dimension="region" 
        measure="sales" 
        title="Sales by Region" 
        asPercentage={true}
        column={2} 
        heightRows={2} 
      />
    </Dashboard>
  );
}
```

## Available Themes

- **`common`**: (Default) Flat white background cards, clean gray borders, and classic ECharts colors.
- **`minimal`**: Light-grey borders, dashed grid lines, and shadowless container panels.
- **`modern`**: Deep indigo dark background gradients, neon series colors, and purple hover borders.
- **`3D`**: Neumorphic volumetric shadows, cylindrical bars, and raised container states.
- **`glass`**: Frosted glassmorphism panels, translucent white borders, and glowing pastel colors.
- **`elegant`**: Luxury dark styling, gold borders, cream typography, and jewel-toned charts.

## API Reference

### Methods and Configurations

| Class | Method / Property | Signature | Description |
| :--- | :--- | :--- | :--- |
| **`Dashboard`** | `constructor` | `(container: HTMLElement, config?: DashboardConfig)` | Initializes the dashboard. `DashboardConfig` supports `columns` (number), `gap` (string), `rowHeight` (string), and `theme` (`ChartTheme`). |
| | `setData` | `(data: any[] \| string)` | Loads the active dataset. Accepts an array of row objects or a raw CSV string. |
| | `setTheme` | `(theme: ChartTheme)` | Updates the theme dynamically for the dashboard container and all registered child charts. |
| | `addChart` | `(chart: Chart)` | Adds and mounts a child `Chart` widget to the responsive layout grid. |
| **`Chart`** | `constructor` | `(config: ChartConfig)` | Defines a chart. `ChartConfig` fields: `type` (`'bar'\|'line'\|'pie'\|'donut'\|'radar'\|'card'\|'funnel'`), `dimension` (group key), `measure` (value key), `title`, `colors`, `valueFormatter`, `column`/`widthColumns`, `heightRows`, `asPercentage`, and `theme`. |
| | `render` | `(data: any[] \| string)` | Aggregates and renders the chart visually using ECharts. Accepts CSV string or object array. |
| | `onFilter` | `(cb: (filter: Filter) => void)` | Registers a category click callback for cross-filtering. |
| | `setResolvedTheme` | `(theme: ChartTheme)` | Internal method to propagate theme setting. |
| | `getResolvedTheme` | `()` | Retrieves the active `ChartTheme` resolved name. |
| | `applyContainerTheme`| `(theme: ChartTheme)` | Style compiler applying container background, border, shadow, and hover transformations. |

## Version History

| Version | Description / Key Additions |
| :--- | :--- |
| **`1.0.0`** | Initial release of IntelliCharts. Includes synchronized cross-filtering, automatic responsive grid layouts, native KPI card support with ellipsis title truncation, fluid CSS typography, React wrappers, and 6 built-in visual themes. |

## License
MIT
