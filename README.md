# IntelliCharts

IntelliCharts is a lightweight, interactive charting library for JavaScript, TypeScript, and React. It connects multiple charts to the same dataset so they can interact with each other automatically.

---

## Documentation

- **[Getting Started](./docs/guide/getting-started.md)**: Installation, basic Vanilla JS/TS setup, React setups, and CSV data parsing.
- **[Automatic Dashboard Generation](./docs/guide/autogenerate.md)**: Using `.autogenerate()` and the React `<AutoDashboard />` component with schema type inference heuristics.
- **[Visual Themes](./docs/guide/themes.md)**: Guide on using the 8 built-in templates (Common, Minimal, Modern, 3D, Glass, Elegant, Neon, Sketch).
- **[API Reference](./docs/api/reference.md)**: Full API parameters, signatures, interfaces, and methods list.

---

## Quick Install

```bash
npm install intellicharts echarts
```

## Quick Start Example (Vanilla JS)

```typescript
import { Dashboard, Chart } from 'intellicharts';

// 1. Create the layout
const dashboard = new Dashboard(document.getElementById('dashboard-root')!, {
  columns: 3,
  gap: '20px',
  theme: 'common'
});

// 2. Define your charts
dashboard.addChart(new Chart({ type: 'card', measure: 'sales', title: 'Total Sales' }));
dashboard.addChart(new Chart({ type: 'bar', dimension: 'region', measure: 'sales', title: 'Sales by Region' }));

// 3. Load data (CSV format supported)
dashboard.setData(`region,sales
North,1500
South,2400`);
```

## React Example

```tsx
import { Dashboard, Chart } from 'intellicharts/react';

export default function App() {
  return (
    <Dashboard data={myData} columns={3} gap="20px">
      <Chart type="card" measure="sales" title="Total Sales" />
      <Chart type="bar" dimension="region" measure="sales" title="Sales by Region" />
    </Dashboard>
  );
}
```
## License
MIT
