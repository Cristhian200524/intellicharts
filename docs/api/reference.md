# API Reference

A detailed guide to the classes, methods, configurations, and React components exported by the IntelliCharts library.

---

## Classes & Methods

### `Dashboard`

The main layout and synchronization engine container.

| Method / Property | Signature | Description |
| :--- | :--- | :--- |
| **`constructor`** | `(container: HTMLElement, config?: DashboardConfig)` | Initializes the dashboard. |
| **`autogenerate`** | `(container: HTMLElement, data: any[] \| string, schema?: Record<string, DataType>, config?: DashboardConfig)` | **(Static)** Automatically creates, structures, and mounts a populated dashboard layout. |
| **`setData`** | `(data: any[] \| string)` | Loads the active dataset. Accepts an array of row objects or a raw CSV string. |
| **`setTheme`** | `(theme: ChartTheme)` | Updates the theme dynamically for the dashboard container and all registered child charts. |
| **`addChart`** | `(chart: Chart)` | Adds and mounts a child `Chart` widget to the responsive layout grid. |
| **`removeChart`** | `(chart: Chart)` | Removes a single chart, cleaning up its DOM container and disposing of its resources. |
| **`removeAllCharts`** | `()` | Removes all registered charts and clears the dashboard grid container completely. |
| **`replaceChart`** | `(oldChart: Chart, newChart: Chart)` | Swaps an existing chart with a new one in-place, reusing the DOM slot and resizing it dynamically. |
| **`getChart`** | `(identifier: string \| number)` | Retrieves a chart from the dashboard by index, or by matching its `id`, `dimension` or `title` string. |
| **`hasChart`** | `(chart: Chart \| string)` | Checks if a chart exists in the dashboard by reference, or by matching its `id`, `dimension` or `title` string. |
| **`getConfig`** | `()` | Returns the active `DashboardConfig` layout settings. |
| **`getData`** | `()` | Returns the active raw dataset loaded in the dashboard. |
| **`clearFilters`** | `()` | Clears all active global cross-filtering selections and updates all charts to display raw data. |
| **`setFilter`** | `(field: string, value: any)` | Explicitly sets a global dimension filter programmatically. |
| **`removeFilter`** | `(field: string)` | Explicitly removes a global dimension filter programmatically. |
| **`getActiveFilters`** | `()` | Returns a copy of the currently active global dimension filters. |
| **`dispose`** | `()` | Cleans up the dashboard by disposing of all child charts, disconnecting resize observers, and clearing listeners. |


---

### `Chart`

Represents a single widget (bar, line, pie, donut, radar, funnel, or KPI card).

| Method / Property | Signature | Description |
| :--- | :--- | :--- |
| **`constructor`** | `(config: ChartConfig)` | Defines a chart configuration. |
| **`mount`** | `(container: HTMLElement)` | Mounts the chart container dynamically (used for standalone rendering outside a Dashboard). |
| **`render`** | `(data: any[] \| string, activeFilters?: Filter[])` | Aggregates and renders the chart visually using the custom Canvas engine. |
| **`setTheme`** | `(theme: ChartTheme)` | Updates the theme dynamically specifically for this chart and triggers a re-render. |
| **`onFilter`** | `(cb: (filter: Filter) => void)` | Registers a category click callback for cross-filtering. |
| **`getContainer`** | `()` | Returns the HTMLElement wrapper container of the chart. |
| **`getConfig`** | `()` | Returns the active `ChartConfig` settings of the chart. |
| **`dispose`** | `()` | Cleans up the chart by disposing of the Canvas elements, disconnecting its resize observer, and removing mouse event listeners. |


---

## Configuration Interfaces

### `DashboardConfig`

Layout parameters for the `Dashboard` container:
- `columns`: (Optional) Maximum number of grid columns on desktop layouts.
- `gap`: (Optional) CSS gap value between grid items (e.g., `'20px'`).
- `rowHeight`: (Optional) Base height spanned by a single grid row (e.g., `'140px'`).
- `theme`: (Optional) Default visual theme applied to children charts.

### `ChartConfig`

Parameters for instantiating a `Chart` widget:
- `id`: (Optional) Unique identifier.
- `type`: Chart type (`'bar' | 'line' | 'pie' | 'donut' | 'radar' | 'card' | 'funnel'`).
- `dimension`: Column key used to group and classify records.
- `measure`: Column key used to aggregate numeric values.
- `title`: Header label displayed at the top of the chart card.
- `colors`: (Optional) Array of color codes to override theme selections.
- `valueFormatter`: (Optional) Custom formatter function for numeric values.
- `column` / `widthColumns`: Column grid span count (default: `1`).
- `heightRows`: Row grid span count (default: `1`).
- `asPercentage`: (Optional) Convert values into percentages dynamically calculated against the currently filtered total.
- `theme`: (Optional) Local visual theme override.

---

## React Component

### `<AutoDashboard />`

Declarative component to autogenerate dashboards in React.

| Prop | Type | Description |
| :--- | :--- | :--- |
| **`data`** | `any[] \| string` | **(Required)** Array of objects or a raw CSV string. |
| **`schema`** | `Record<string, DataType>` | (Optional) Explicit DataType overrides for specific columns. |
| **`theme`** | `ChartTheme` | (Optional) Theme applied to the dashboard. |
| **`columns`** | `number` | (Optional) Grid columns count. |
| **`gap`** | `string` | (Optional) Grid gap size. |
| **`rowHeight`** | `string` | (Optional) Base height of a grid row. |
| **`className`** | `string` | (Optional) HTML container class. |
| **`style`** | `CSSProperties` | (Optional) HTML container styles. |
