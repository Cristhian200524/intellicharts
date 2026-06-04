# Getting Started

IntelliCharts is a lightweight charting library designed to create interactive dashboards. It connects multiple charts to the same dataset so they can interact with each other automatically through synchronized cross-filtering.

## Installation

Install the library along with its peer dependency, Apache ECharts:

```bash
npm install intellicharts echarts
```

---

## Vanilla JS/TS Usage

To use the library in plain JavaScript or TypeScript projects, first add a container element in your HTML:

```html
<div id="dashboard-root"></div>
```

Then, initialize the dashboard and charts in your code:

```typescript
import { Dashboard, Chart } from 'intellicharts';

const data = [
  { category: 'Electronics', region: 'North', sales: 1500 },
  { category: 'Clothing', region: 'North', sales: 600 },
  { category: 'Electronics', region: 'South', sales: 800 },
  { category: 'Clothing', region: 'South', sales: 1200 }
];

// 1. Create the dashboard layout container
const dashboard = new Dashboard(document.getElementById('dashboard-root')!, {
  columns: 4,
  gap: '20px',
  rowHeight: '140px',
  theme: 'common' // Optional global theme
});

// 2. Define charts and widgets
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

// 3. Mount charts onto the dashboard and load the dataset
dashboard.addChart(kpiCard);
dashboard.addChart(barChart);
dashboard.setData(data);
```

### Loading CSV Data Natively

IntelliCharts parses and handles CSV data out-of-the-box. Instead of pre-parsing headers and rows into JSON objects manually, you can load a raw CSV string directly using `setData()`:

```typescript
const csvData = `category,region,sales
Electronics,North,1500
Clothing,North,600
Electronics,South,800
Clothing,South,1200`;

dashboard.setData(csvData);
```

---

## React Usage

IntelliCharts comes with declarative components designed specifically for React. You can import them directly from `intellicharts/react`:

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

---

## Interactive Cross-Filtering

One of the core features of IntelliCharts is **synchronized cross-filtering**. Clicking on any data category (such as a specific region bar or a category slice in a pie chart) will filter the dataset globally. 

All other charts bound to the dashboard will automatically dim unselected series and re-aggregate their totals to show only the information corresponding to the selected category. Clicking the category again clears the filter.
