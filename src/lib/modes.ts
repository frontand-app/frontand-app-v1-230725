// Mode adapters for building canonical payloads

export type ParsedCSV = { headers: string[]; rows: string[][] };

export type LoopOverRowsMode = 'freestyle' | 'keyword-kombat' | 'vc-analyst';

export interface LoopOverRowsOptions {
  testMode?: boolean;
  enableGoogleSearch?: boolean;
  webhookUrl?: string;
  batchSize?: number;
  selectedColumns?: string[]; // subset of headers to include (freestyle/vc-analyst)
  maxPreviewRows?: number; // when testMode applies, default 2
}

export const buildLoopOverRowsPayload = (
  mode: LoopOverRowsMode,
  inputs: Record<string, any>,
  opts: LoopOverRowsOptions & { parsedCsv?: ParsedCSV }
) => {
  const {
    testMode = false,
    enableGoogleSearch = false,
    webhookUrl,
    batchSize = 10,
    selectedColumns,
    parsedCsv,
    maxPreviewRows = 2,
  } = opts || {};

  if (mode === 'keyword-kombat') {
    const raw = inputs.keywords || '';
    const lines = Array.isArray(raw)
      ? raw
      : String(raw)
          .split('\n')
          .map((l: string) => l.trim())
          .filter((l: string) => l.length > 0);
    return {
      mode: 'keyword-kombat',
      keywords: lines,
      company_url: inputs.company_url,
      keyword_variable: inputs.keyword_variable || 'keyword',
      test_mode: testMode,
      enable_google_search: enableGoogleSearch,
      ...(webhookUrl ? { config: { webhook_url: webhookUrl } } : {}),
    };
  }

  // freestyle / vc-analyst use CSV + prompt
  const csv = parsedCsv;
  if (!csv || !csv.headers || !Array.isArray(csv.rows)) {
    throw new Error('Invalid or missing CSV data');
  }
  const activeHeaders = (selectedColumns && selectedColumns.length > 0)
    ? selectedColumns
    : csv.headers;
  const headerIndices = activeHeaders
    .map((h) => csv.headers.indexOf(h))
    .filter((i) => i >= 0);

  const rowsToProcess = testMode ? csv.rows.slice(0, maxPreviewRows) : csv.rows;
  const dataDict: Record<string, string[]> = {};
  rowsToProcess.forEach((row, index) => {
    const filteredRow = headerIndices.map((i) => row[i]);
    dataDict[`row_${index + 1}`] = filteredRow as string[];
  });

  return {
    data: dataDict,
    headers: activeHeaders,
    prompt: String(inputs.prompt || '').trim(),
    output_schema: inputs.output_schema,
    batch_size: batchSize,
    enable_google_search: enableGoogleSearch,
    test_mode: testMode,
    mode,
    ...(webhookUrl ? { config: { webhook_url: webhookUrl } } : {}),
  };
};

