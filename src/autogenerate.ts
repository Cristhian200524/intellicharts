import { Dashboard, DashboardConfig } from './Dashboard';
import { Chart, ChartConfig } from './Chart';
import { parseCSV } from './csv';

/**
 * Represents the supported data types for schema analysis and visualization capabilities.
 */
export type DataType =
  | 'integer'
  | 'float'
  | 'string'
  | 'category'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'percentage'
  | 'geo';

/**
 * Configuration options for the automatic dashboard generator.
 */
export interface AutogenerateOptions {
  schema?: Record<string, DataType>;
  config?: DashboardConfig;
}

/**
 * Defines the allowed data types for dimensions and measures of a specific chart type.
 */
export interface ChartCapability {
  allowedDimensions: DataType[];
  allowedMeasures: DataType[];
}

/**
 * Dictionary mapping chart types to their supported data types for dimensions and measures.
 */
export const CHART_CAPABILITIES: Record<string, ChartCapability> = {
  card: {
    allowedDimensions: [],
    allowedMeasures: ['integer', 'float', 'percentage']
  },
  line: {
    allowedDimensions: ['date', 'datetime', 'time', 'category', 'integer'],
    allowedMeasures: ['integer', 'float', 'percentage']
  },
  bar: {
    allowedDimensions: ['category', 'string', 'date', 'datetime', 'boolean', 'geo'],
    allowedMeasures: ['integer', 'float', 'percentage']
  },
  pie: {
    allowedDimensions: ['category', 'boolean', 'geo'],
    allowedMeasures: ['integer', 'float', 'percentage']
  },
  donut: {
    allowedDimensions: ['category', 'boolean', 'geo'],
    allowedMeasures: ['integer', 'float', 'percentage']
  },
  radar: {
    allowedDimensions: ['category', 'boolean'],
    allowedMeasures: ['integer', 'float', 'percentage']
  },
  funnel: {
    allowedDimensions: ['category', 'boolean'],
    allowedMeasures: ['integer', 'float', 'percentage']
  }
};

/**
 * Humanizes a technical column name to be readable for end-users.
 *
 * @param str The raw column name.
 * @returns Human-readable formatted string.
 */
export function humanize(str: string): string {
  if (!str) return '';
  if (str === '__count') return 'Records';
  
  const spaced = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ');
    
  return spaced
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Analyzes a list of values to infer the most suitable DataType for a field.
 *
 * @param values Array of non-empty values.
 * @param keyName Name of the field.
 * @returns Inferred DataType.
 */
export function inferFieldType(values: any[], keyName: string): DataType {
  if (values.length === 0) {
    return 'string';
  }

  const isAllBoolean = values.every(v =>
    typeof v === 'boolean' ||
    (typeof v === 'string' && ['true', 'false', 'yes', 'no'].includes(v.trim().toLowerCase()))
  );
  if (isAllBoolean) {
    return 'boolean';
  }

  const dateOnlyRegex = /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$|^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/;
  const timeOnlyRegex = /^\d{1,2}:\d{2}(:\d{2})?$/;
  const datetimeRegex = /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}[ T]\d{1,2}:\d{2}/;

  const isAllTime = values.every(v => typeof v === 'string' && timeOnlyRegex.test(v.trim()));
  if (isAllTime) {
    return 'time';
  }

  const isAllDateOnly = values.every(v => {
    if (v instanceof Date) return true;
    if (typeof v !== 'string') return false;
    const clean = v.trim();
    return dateOnlyRegex.test(clean) && !isNaN(Date.parse(clean));
  });
  if (isAllDateOnly) {
    return 'date';
  }

  const isAllDatetime = values.every(v => {
    if (v instanceof Date) return true;
    if (typeof v !== 'string') return false;
    const clean = v.trim();
    return (datetimeRegex.test(clean) || clean.includes('T')) && !isNaN(Date.parse(clean));
  });
  if (isAllDatetime) {
    return 'datetime';
  }

  const geoKeywords = [
    'country', 'city', 'state', 'region', 'latitude', 'longitude',
    'lat', 'lon', 'postalcode', 'zipcode', 'zip', 'county', 'province'
  ];
  const cleanKeyForGeo = keyName.toLowerCase().replace(/[^a-z]/g, '');
  const isGeoKey = geoKeywords.includes(cleanKeyForGeo) || geoKeywords.some(kw => cleanKeyForGeo.includes(kw));
  if (isGeoKey) {
    return 'geo';
  }

  const isAllNumeric = values.every(v => {
    if (typeof v === 'number') return !isNaN(v);
    if (typeof v === 'string') {
      const clean = v.trim();
      if (clean === '') return false;
      if (clean.endsWith('%')) {
        const numPart = clean.slice(0, -1).trim();
        return !isNaN(Number(numPart));
      }
      return !isNaN(Number(clean));
    }
    return false;
  });

  if (isAllNumeric) {
    const hasPctSymbol = values.some(v => typeof v === 'string' && v.trim().endsWith('%'));
    if (hasPctSymbol) {
      return 'percentage';
    }

    let hasDecimal = false;
    for (const v of values) {
      let numVal: number;
      if (typeof v === 'number') {
        numVal = v;
      } else {
        numVal = Number(String(v).trim().replace(/%/g, ''));
      }
      if (numVal % 1 !== 0) {
        hasDecimal = true;
        break;
      }
    }
    return hasDecimal ? 'float' : 'integer';
  }

  const stringKeywords = ['name', 'id', 'email', 'desc', 'comment', 'text', 'key', 'url', 'uuid', 'code', 'slug'];
  const cleanKeyForStr = keyName.toLowerCase().replace(/[^a-z]/g, '');
  const isStringKey = stringKeywords.includes(cleanKeyForStr) || stringKeywords.some(kw => cleanKeyForStr.includes(kw));
  if (isStringKey) {
    return 'string';
  }

  const uniqueVals = new Set(values.map(v => String(v).trim()));
  const cardinality = uniqueVals.size;
  if (cardinality <= 15 && (cardinality <= 3 || (cardinality / values.length) <= 0.4)) {
    return 'category';
  }

  return 'string';
}

/**
 * Analyzes the records in a dataset to infer the schema mapping of keys to DataTypes.
 *
 * @param data Array of parsed objects.
 * @returns Schema mapping of keys to inferred DataTypes.
 */
export function inferSchema(data: any[]): Record<string, DataType> {
  const schema: Record<string, DataType> = {};
  if (data.length === 0) return schema;

  const allKeys = new Set<string>();
  for (const row of data) {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach(k => allKeys.add(k));
    }
  }

  for (const key of allKeys) {
    const values = data
      .map(row => row[key])
      .filter(val => val !== undefined && val !== null && val !== '');
    schema[key] = inferFieldType(values, key);
  }

  return schema;
}

/**
 * Plans and appends autogenerated charts directly onto an existing Dashboard instance.
 *
 * @param dashboard The target Dashboard instance.
 * @param data The raw dataset or CSV string.
 * @param schemaOverride Optional explicit DataType mapping overrides.
 */
export function setupAutogeneratedCharts(
  dashboard: Dashboard,
  data: any[] | string,
  schemaOverride?: Record<string, DataType>
): void {
  let parsedData: any[] = [];
  if (typeof data === 'string') {
    parsedData = parseCSV(data);
  } else {
    parsedData = data.map(item => ({ ...item }));
  }

  if (parsedData.length === 0) return;

  const inferred = inferSchema(parsedData);
  const schema = { ...inferred, ...schemaOverride };

  const dimensions: string[] = [];
  const measures: string[] = [];

  Object.entries(schema).forEach(([key, type]) => {
    if (type === 'integer' || type === 'float' || type === 'percentage') {
      measures.push(key);
    } else {
      dimensions.push(key);
    }
  });

  if (measures.length === 0) {
    const countField = '__count';
    schema[countField] = 'integer';
    measures.push(countField);
    parsedData.forEach(row => {
      row[countField] = 1;
    });
  }

  dimensions.sort((a, b) => {
    const typeA = schema[a];
    const typeB = schema[b];
    const score = (t: DataType) => {
      if (t === 'date' || t === 'datetime') return 3;
      if (t === 'category' || t === 'boolean' || t === 'geo') return 2;
      if (t === 'time') return 1;
      return 0;
    };
    return score(typeB) - score(typeA);
  });

  const generatedCharts: ChartConfig[] = [];
  const maxChartsCount = 6;
  const layoutColumns = dashboard.getConfig().columns ?? 3;

  const cardMeasures = measures.slice(0, 3);
  for (const m of cardMeasures) {
    generatedCharts.push({
      type: 'card',
      dimension: '',
      measure: m,
      title: m === '__count' ? 'Total Records' : `Total ${humanize(m)}`,
      widthColumns: 1,
      heightRows: 1,
      valueFormatter: (val) => {
        if (schema[m] === 'percentage') {
          return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + '%';
        }
        const decimals = schema[m] === 'float' ? 2 : 0;
        return val.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      }
    });
  }

  const temporalDim = dimensions.find(d => schema[d] === 'date' || schema[d] === 'datetime');
  if (temporalDim && measures.length > 0) {
    const measure = measures[0];
    generatedCharts.push({
      type: 'line',
      dimension: temporalDim,
      measure: measure === '__count' ? '__count' : measure,
      title: `${humanize(temporalDim)} vs ${humanize(measure === '__count' ? 'Records' : measure)}`,
      widthColumns: Math.min(3, layoutColumns),
      heightRows: 1
    });
  }

  const categoricalDims = dimensions.filter(
    d => d !== temporalDim && ['category', 'boolean', 'geo', 'string'].includes(schema[d])
  );

  let categoryIndex = 0;
  for (const dim of categoricalDims) {
    if (generatedCharts.length >= maxChartsCount) {
      break;
    }

    const measure = measures[categoryIndex % measures.length];
    const values = parsedData.map(r => r[dim]).filter(v => v !== undefined && v !== null && v !== '');
    const uniqueValuesCount = new Set(values).size;

    let chartType: 'bar' | 'pie' | 'donut' | 'radar' | 'funnel' = 'bar';
    let widthSpan = 1;

    const dimType = schema[dim];
    if (dimType === 'category' || dimType === 'boolean' || dimType === 'geo') {
      if (uniqueValuesCount <= 5) {
        const choices: ('pie' | 'donut' | 'funnel')[] = ['donut', 'pie', 'funnel'];
        chartType = choices[categoryIndex % choices.length];
        widthSpan = 1;
      } else if (uniqueValuesCount <= 10) {
        chartType = categoryIndex % 2 === 0 ? 'bar' : 'radar';
        widthSpan = 1;
      } else {
        chartType = 'bar';
        widthSpan = Math.min(2, layoutColumns);
      }
    } else {
      chartType = 'bar';
      widthSpan = Math.min(2, layoutColumns);
    }

    generatedCharts.push({
      type: chartType,
      dimension: dim,
      measure,
      title: `${humanize(dim)} vs ${humanize(measure === '__count' ? 'Records' : measure)}`,
      widthColumns: widthSpan,
      heightRows: 1
    });

    categoryIndex++;
  }

  dashboard.setData(parsedData);

  for (const chartConfig of generatedCharts) {
    const chart = new Chart(chartConfig);
    dashboard.addChart(chart);
  }
}

/**
 * Automatically creates and populates a Dashboard with charts optimized for the provided dataset.
 *
 * @param container The parent DOM element to render the Dashboard into.
 * @param data Array of records or a raw CSV string.
 * @param schema Optional schema overrides to explicitly specify DataTypes for columns.
 * @param config Optional Dashboard layout and theme configurations.
 * @returns Instantiated and populated Dashboard instance.
 */
export function autogenerate(
  container: HTMLElement,
  data: any[] | string,
  schema?: Record<string, DataType>,
  config?: DashboardConfig
): Dashboard {
  const dashboard = new Dashboard(container, config);
  setupAutogeneratedCharts(dashboard, data, schema);
  return dashboard;
}
