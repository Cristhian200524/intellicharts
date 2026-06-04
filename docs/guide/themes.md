# Visual Themes

IntelliCharts features 8 built-in themes that configure the styles of all elements globally (dashboard panels, backgrounds, typography, borders, shadows, and chart color palettes) or individually per chart widget.

---

## Setting a Theme

You can apply a theme during dashboard initialization:

```typescript
const dashboard = new Dashboard(container, {
  theme: 'sketch' // Apply sketch theme globally
});
```

You can also apply themes individually to specific charts to override the dashboard theme:

```typescript
const chart = new Chart({
  type: 'bar',
  dimension: 'region',
  measure: 'sales',
  theme: 'minimal' // Force minimal style for this chart
});
```

---

## Dynamic Theme Switching

You can switch the entire dashboard theme dynamically at runtime. The layout engine and all registered charts will redraw instantly using the new theme's color palette, backgrounds, and fonts:

```typescript
// Swaps theme on-the-fly
dashboard.setTheme('modern');
```

---

## Available Themes

| Theme Name | Visual Style / Aesthetic |
| :--- | :--- |
| **`common`** | (Default) White card backgrounds, gray borders, and a default chart color palette. |
| **`minimal`** | Light-gray borders, dashed grid lines, flat graphics, and no container shadows. |
| **`modern`** | Indigo gradient background, neon colors, and purple hover borders. |
| **`3D`** | Neumorphic shadows, cylindrical bars, and raised hover states. |
| **`glass`** | Translucent borders, frosted background, and pastel colors. |
| **`elegant`** | Dark style featuring gold borders, cream-colored text, and a jewel-toned chart color palette. |
| **`neon`** | Cyberpunk theme with neon cyan borders, dark gradients, and neon colors. |
| **`sketch`** | Sketch-style borders, charcoal grids, and handwriting fonts on warm paper. |
