export type NormalizedTable = {
  columns: string[];
  rows: Array<Record<string, any>>;
};

const tryParseJson = (val: any) => {
  if (typeof val !== 'string') return val;
  const s = val.trim();
  if (!(s.startsWith('{') || s.startsWith('['))) return val;
  try {
    return JSON.parse(s);
  } catch {
    return val;
  }
};

export const flattenValue = (value: any): any => {
  const parsed = tryParseJson(value);
  if (Array.isArray(parsed)) {
    if (parsed.length === 1 && parsed[0] && typeof parsed[0] === 'object') {
      return parsed[0];
    }
    return parsed;
  }
  return parsed;
};

export const orderColumns = (cols: string[]): string[] => {
  const unique = Array.from(new Set(cols));
  const first: string[] = [];
  const rest: string[] = [];
  unique.forEach((c) => (c === 'row_key' ? first.push(c) : rest.push(c)));
  return [...first, ...rest];
};

export const normalizeResult = (_workflowId: string, raw: any): NormalizedTable => {
  const data: Array<Record<string, any>> = Array.isArray(raw?.results)
    ? raw.results
    : Array.isArray(raw)
      ? raw
      : [];

  const rows = data.map((row) => {
    const out: Record<string, any> = {};
    Object.entries(row || {}).forEach(([k, v]) => {
      const shouldFlatten = k !== 'row_key';
      const candidate = shouldFlatten ? flattenValue(v) : v;
      if (shouldFlatten && candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        Object.entries(candidate).forEach(([innerK, innerV]) => {
          out[innerK] = innerV;
        });
      } else {
        out[k] = candidate;
      }
    });
    return out;
  });

  const columns = orderColumns(
    Array.from(
      rows.reduce<Set<string>>((set, r) => {
        Object.keys(r || {}).forEach((k) => set.add(k));
        return set;
      }, new Set<string>())
    )
  );

  return { columns, rows };
};

