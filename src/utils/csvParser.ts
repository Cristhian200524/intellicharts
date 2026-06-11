/**
 * Parses a CSV string into an array of objects.
 * Supports standard RFC 4180 rules, including quoted fields and escaped quotes.
 * Automatically converts fields that look like numbers into numeric values.
 *
 * @param csvText The raw CSV string to parse.
 * @returns An array of parsed objects representing the rows.
 */
export function parseCSV(csvText: string): any[] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++; // skip the second quote
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\r' || char === '\n') {
        currentLine.push(currentVal.trim());
        if (currentLine.length > 0 && !(currentLine.length === 1 && currentLine[0] === '')) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentVal = '';
        if (char === '\r' && nextChar === '\n') {
          i++; // skip the \n character
        }
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal !== '' || currentLine.length > 0) {
    currentLine.push(currentVal.trim());
    if (currentLine.length > 0 && !(currentLine.length === 1 && currentLine[0] === '')) {
      lines.push(currentLine);
    }
  }

  if (lines.length < 2) return [];

  const headers = lines[0];
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const obj: any = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (!header) continue;
      let value: any = row[j] !== undefined ? row[j] : '';
      if (value !== '' && !isNaN(Number(value))) {
        value = Number(value);
      }
      obj[header] = value;
    }
    data.push(obj);
  }
  return data;
}
