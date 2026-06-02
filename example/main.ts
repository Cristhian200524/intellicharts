import { Dashboard, Chart, ChartTheme } from '../src/index';

const csvData = `category,region,sales
Electronics,North,1500
Electronics,South,800
Clothing,North,600
Clothing,South,1200
Food,North,2000
Food,South,1800
Electronics,East,900
Clothing,East,1100
Food,East,500`;

const dashboard = new Dashboard(document.getElementById('dashboard-root')!, {
  columns: 5,
  gap: '20px',
  rowHeight: '140px',
  theme: 'common'
});

const chartKPI = new Chart({
  type: 'card',
  dimension: 'category',
  measure: 'sales',
  title: 'Total Sales',
  valueFormatter: (val) => '$' + val.toLocaleString('en-US'),
  widthColumns: 5,
  heightRows: 1
});

const chartDonut = new Chart({
  type: 'donut',
  dimension: 'category',
  measure: 'sales',
  title: 'Category (Donut)',
  widthColumns: 1,
  heightRows: 2
});

const chartPie = new Chart({
  type: 'pie',
  dimension: 'region',
  measure: 'sales',
  title: 'Region (Pie)',
  widthColumns: 1,
  heightRows: 2
});

const chartBar = new Chart({
  type: 'bar',
  dimension: 'category',
  measure: 'sales',
  title: 'Sales by Category',
  widthColumns: 2,
  heightRows: 2
});

const chartRadar = new Chart({
  type: 'radar',
  dimension: 'category',
  measure: 'sales',
  title: 'Radar Comparison',
  widthColumns: 1,
  heightRows: 2,
});

const chartLine = new Chart({
  type: 'line',
  dimension: 'category',
  measure: 'sales',
  title: 'Sales Trend',
  widthColumns: 3,
  heightRows: 2
});

const chartFunnel = new Chart({
  type: 'funnel',
  dimension: 'category',
  measure: 'sales',
  title: 'Category (Funnel)',
  widthColumns: 2,
  heightRows: 2
});

dashboard.addChart(chartKPI);
dashboard.addChart(chartDonut);
dashboard.addChart(chartPie);
dashboard.addChart(chartBar);
dashboard.addChart(chartRadar);
dashboard.addChart(chartFunnel);
dashboard.addChart(chartLine);

dashboard.setData(csvData);

const themeSelector = document.getElementById('theme-selector') as HTMLSelectElement;
const currentThemeLabel = document.getElementById('current-theme-label');

if (themeSelector) {
  themeSelector.addEventListener('change', () => {
    const selectedTheme = themeSelector.value as ChartTheme;
    dashboard.setTheme(selectedTheme);
    document.body.className = `theme-${selectedTheme}`;
    if (currentThemeLabel) {
      currentThemeLabel.innerText = selectedTheme === '3D' ? 'Volumetric 3D' : selectedTheme;
    }
  });
}
