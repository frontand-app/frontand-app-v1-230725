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

// Crawl workflow types and adapters
export type CrawlTask = 'gmaps' | 'contacts' | 'imprint' | 'logo';

export interface CrawlOptions {
  testMode?: boolean;
  enableGoogleSearch?: boolean;
  webhookUrl?: string;
}

export const buildCrawlPayload = (
  task: CrawlTask,
  inputs: Record<string, any>,
  opts: CrawlOptions = {}
) => {
  const { testMode = false, enableGoogleSearch = false, webhookUrl } = opts;

  // Base payload WITHOUT task parameter (individual backends don't support it yet)
  const basePayload = {
    test_mode: testMode,
    enable_google_search: enableGoogleSearch,
    ...(webhookUrl ? { config: { webhook_url: webhookUrl } } : {}),
  };

  switch (task) {
    case 'imprint': {
      const websites = parseTextInput(inputs.websites);
      if (!websites || websites.length === 0) {
        throw new Error('Website URLs are required for imprint extraction');
      }
      return {
        ...basePayload,
        websites: testMode ? websites.slice(0, 3) : websites,
      };
    }

    case 'contacts': {
      const companies = parseTextInput(inputs.companies);
      const contactTypes = Array.isArray(inputs.contact_types) 
        ? inputs.contact_types 
        : [];
      
      if (!companies || companies.length === 0) {
        throw new Error('Company names/URLs are required for contact extraction');
      }
      if (contactTypes.length === 0) {
        throw new Error('At least one contact type must be selected');
      }
      
      return {
        ...basePayload,
        companies: testMode ? companies.slice(0, 3) : companies,
        contact_types: contactTypes,
      };
    }

    case 'logo': {
      const urls = parseTextInput(inputs.urls);
      if (!urls || urls.length === 0) {
        throw new Error('Website URLs are required for logo extraction');
      }
      return {
        ...basePayload,
        urls: testMode ? urls.slice(0, 3) : urls,
        format: inputs.format || 'png',
        size: inputs.size || 'original',
      };
    }

    case 'gmaps': {
      const locations = parseTextInput(inputs.locations);
      const searchTerms = parseTextInput(inputs.search_terms);
      
      if (!locations || locations.length === 0) {
        throw new Error('Locations are required for Google Maps search');
      }
      if (!searchTerms || searchTerms.length === 0) {
        throw new Error('Search terms are required for Google Maps search');
      }
      
      return {
        ...basePayload,
        locations: testMode ? locations.slice(0, 2) : locations,
        search_terms: testMode ? searchTerms.slice(0, 2) : searchTerms,
        max_results: inputs.max_results || 10,
      };
    }

    default:
      throw new Error(`Unsupported crawl task: ${task}`);
  }
};

// Helper function to parse text input (textarea/csv format)
const parseTextInput = (input: any): string[] => {
  if (!input) return [];
  
  const text = Array.isArray(input) ? input.join('\n') : String(input);
  return text
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
};

