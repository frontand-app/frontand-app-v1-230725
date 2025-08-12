// Workflow Execution API
// This handles tracking and managing workflow executions

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  progress?: number;
  inputData: Record<string, any>;
  results?: any;
  files?: ExecutionFile[];
  costCredits: number;
  estimatedTime?: number;
  actualTime?: number;
  errorMessage?: string;
  userId?: string;
}

export interface ExecutionFile {
  id: string;
  name: string;
  type: string;
  size: number;
  downloadUrl: string;
  createdAt: string;
}

export interface CreateExecutionRequest {
  workflowId: string;
  inputData: Record<string, any>;
  testMode?: boolean;
  userId?: string;
}

export interface UpdateExecutionRequest {
  status?: WorkflowExecution['status'];
  progress?: number;
  results?: any;
  files?: ExecutionFile[];
  errorMessage?: string;
  completedAt?: string;
  actualTime?: number;
  costCredits?: number;
}

// In-memory storage for demo (replace with real database in production)
let executions: WorkflowExecution[] = [];
let executionIdCounter = 1;

// Persistence helpers so executions survive navigation/refresh within the same browser
const STORAGE_KEY = 'frontand_executions_v1';
const persistExecutions = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(executions));
  } catch {}
};

(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        executions = parsed as WorkflowExecution[];
        // Derive next ID counter from highest existing id
        const maxId = executions
          .map((e) => parseInt((e.id || '').replace(/[^0-9]/g, ''), 10))
          .filter((n) => !isNaN(n))
          .reduce((m, n) => Math.max(m, n), 0);
        executionIdCounter = Math.max(1, maxId + 1);
      }
    }
  } catch {}
})();

// Generate unique execution ID
const generateExecutionId = (): string => {
  return `exec_${String(executionIdCounter++).padStart(6, '0')}`;
};

// Create a new workflow execution
export const createExecution = async (request: CreateExecutionRequest): Promise<WorkflowExecution> => {
  const execution: WorkflowExecution = {
    id: generateExecutionId(),
    workflowId: request.workflowId,
    workflowName: getWorkflowName(request.workflowId),
    status: 'queued',
    createdAt: new Date().toISOString(),
    inputData: request.inputData,
    costCredits: 0,
    userId: request.userId,
  };

  executions.push(execution);
  persistExecutions();

  // Start processing asynchronously
  processExecution(execution.id, request.testMode);

  return execution;
};

// Get all executions for a user
export const getExecutions = async (userId?: string): Promise<WorkflowExecution[]> => {
  return executions
    .filter(exec => !userId || exec.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Get a specific execution
export const getExecution = async (executionId: string): Promise<WorkflowExecution | null> => {
  return executions.find(exec => exec.id === executionId) || null;
};

// Update an execution
export const updateExecution = async (
  executionId: string, 
  updates: UpdateExecutionRequest
): Promise<WorkflowExecution | null> => {
  const index = executions.findIndex(exec => exec.id === executionId);
  if (index === -1) return null;

  executions[index] = { ...executions[index], ...updates };
  persistExecutions();
  return executions[index];
};

// Cancel an execution
export const cancelExecution = async (executionId: string): Promise<boolean> => {
  const execution = await updateExecution(executionId, {
    status: 'cancelled',
    completedAt: new Date().toISOString()
  });
  return execution !== null;
};

// Retry a failed execution
export const retryExecution = async (executionId: string): Promise<WorkflowExecution | null> => {
  const originalExecution = await getExecution(executionId);
  if (!originalExecution) return null;

  // Create a new execution with the same input data
  return createExecution({
    workflowId: originalExecution.workflowId,
    inputData: originalExecution.inputData,
    userId: originalExecution.userId
  });
};

// Delete an execution
export const deleteExecution = async (executionId: string): Promise<boolean> => {
  const index = executions.findIndex(exec => exec.id === executionId);
  if (index === -1) return false;

  executions.splice(index, 1);
  persistExecutions();
  return true;
};

// Get execution statistics
export const getExecutionStats = async (userId?: string) => {
  const userExecutions = await getExecutions(userId);
  
  return {
    total: userExecutions.length,
    running: userExecutions.filter(e => e.status === 'running').length,
    queued: userExecutions.filter(e => e.status === 'queued').length,
    completed: userExecutions.filter(e => e.status === 'completed').length,
    failed: userExecutions.filter(e => e.status === 'failed').length,
    cancelled: userExecutions.filter(e => e.status === 'cancelled').length,
    totalCreditsUsed: userExecutions.reduce((sum, e) => sum + e.costCredits, 0),
    averageExecutionTime: calculateAverageExecutionTime(userExecutions),
  };
};

// Calculate average execution time for completed executions
const calculateAverageExecutionTime = (executions: WorkflowExecution[]): number => {
  const completedWithTime = executions.filter(e => e.status === 'completed' && e.actualTime);
  if (completedWithTime.length === 0) return 0;
  
  const totalTime = completedWithTime.reduce((sum, e) => sum + (e.actualTime || 0), 0);
  return Math.round(totalTime / completedWithTime.length);
};

// Utility: build downloadable files from results
const buildCsvFromObjects = (rows: Array<Record<string, any>>): string => {
  if (!rows || rows.length === 0) return '';
  const headers = Array.from(
    rows.reduce<Set<string>>((set, r) => {
      Object.keys(r || {}).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const headerLine = headers.join(',');
  const lines = rows.map((r) => headers.map((h) => escape(r[h])).join(','));
  return [headerLine, ...lines].join('\n');
};

const createDownloadFile = (name: string, mime: string, content: string): ExecutionFile => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  return {
    id: 'file_' + Math.random().toString(36).slice(2),
    name,
    type: mime.split('/')[1] || 'txt',
    size: blob.size,
    downloadUrl: url,
    createdAt: new Date().toISOString(),
  };
};

export const buildFilesForResults = (workflowId: string, results: any): ExecutionFile[] => {
  try {
    // Use shared normalizer so CSV matches the UI table
    let rows: Array<Record<string, any>> = [];
    try {
      // dynamic require-style import without await for ESM bundlers
      const mod: any = (window as any)?.__frontand_normalizers__ || null;
      if (mod && typeof mod.normalizeResult === 'function') {
        rows = mod.normalizeResult(workflowId, results).rows;
      } else {
        // fallback: naive extraction
        if (Array.isArray(results)) rows = results as Array<Record<string, any>>;
        else if (results && Array.isArray(results.results)) rows = results.results as Array<Record<string, any>>;
      }
    } catch {
      if (Array.isArray(results)) rows = results as Array<Record<string, any>>;
      else if (results && Array.isArray(results.results)) rows = results.results as Array<Record<string, any>>;
    }
    const files: ExecutionFile[] = [];
    if (rows.length > 0) {
      const csv = buildCsvFromObjects(rows);
      files.push(createDownloadFile('results.csv', 'text/csv', csv));
    }
    files.push(createDownloadFile('results.json', 'application/json', JSON.stringify(results, null, 2)));
    return files;
  } catch {
    return [];
  }
};

export const calculateCredits = (params: {
  workflowId: string;
  rowsProcessed?: number;
  promptChars?: number;
  actualTimeSeconds?: number;
  cpuCores?: number;
  memoryGB?: number;
}): number => {
  const {
    workflowId,
    rowsProcessed = 1,
    promptChars = 500,
    actualTimeSeconds = 10,
    cpuCores = 8,
    memoryGB = 32,
  } = params;
  // Estimate tokens ~ chars/4
  const estTokens = Math.max(1, Math.round((promptChars / 4) * rowsProcessed));
  const tokenRate = 0.000002; // credits per token (tunable)
  const computeRate = 0.00005; // credits per second per CPU core
  const memoryRate = 0.000005; // credits per second per GB RAM
  const tokenCost = estTokens * tokenRate;
  const computeCost = actualTimeSeconds * cpuCores * computeRate;
  const memCost = actualTimeSeconds * memoryGB * memoryRate;
  const base = workflowId === 'loop-over-rows' ? 0.02 : 0.01;
  const total = base + tokenCost + computeCost + memCost;
  return Math.round(total * 100) / 100; // 2 decimals
};

// Mock workflow processing function
const processExecution = async (executionId: string, testMode: boolean = false) => {
  const execution = await getExecution(executionId);
  if (!execution) return;

  try {
    // Update to running status
    await updateExecution(executionId, {
      status: 'running',
      progress: 0
    });

    // Simulate processing with progress updates
    const totalSteps = testMode ? 3 : 10;
    const stepTime = testMode ? 500 : 2000; // Faster for test mode

    for (let step = 1; step <= totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, stepTime));
      
      const progress = Math.round((step / totalSteps) * 100);
      await updateExecution(executionId, { progress });
    }

    // Mock results based on workflow type
    const results = generateMockResults(execution.workflowId, execution.inputData, testMode);
    const files = buildFilesForResults(execution.workflowId, results);
    const costCredits = calculateCredits({
      workflowId: execution.workflowId,
      rowsProcessed: (results && Array.isArray((results as any).results)) ? (results as any).results.length : 10,
      promptChars: JSON.stringify(execution.inputData || {}).length,
      actualTimeSeconds: (totalSteps * stepTime) / 1000,
    });

    // Complete the execution
    await updateExecution(executionId, {
      status: 'completed',
      progress: 100,
      results,
      files,
      costCredits,
      completedAt: new Date().toISOString(),
      actualTime: totalSteps * stepTime / 1000
    });

  } catch (error) {
    // Handle execution failure
    await updateExecution(executionId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      completedAt: new Date().toISOString()
    });
  }
};

// Generate mock results based on workflow type
const generateMockResults = (workflowId: string, inputData: any, testMode: boolean) => {
  switch (workflowId) {
    case 'loop-over-rows':
      return {
        rowsProcessed: testMode ? 5 : 150,
        successRate: 94,
        avgProcessingTime: 2.3
      };
    
    case 'crawl4imprint':
      return {
        sitesProcessed: testMode ? 2 : 25,
        dataExtracted: testMode ? 18 : 380,
        successRate: 96
      };
    
    case 'csv-transformer':
      return {
        rowsProcessed: testMode ? 10 : 1250,
        validationErrors: testMode ? 1 : 23,
        transformationsApplied: 3
      };
    
    default:
      return {
        itemsProcessed: testMode ? 3 : 45,
        successRate: 92
      };
  }
};

// Generate mock files based on workflow type
// Removed old generateMockFiles that returned 404 links

// Calculate mock cost based on workflow and input data
const calculateMockCost = (_workflowId: string, _inputData: any, _testMode: boolean): number => 0;

// Get workflow name by ID (replace with actual workflow registry lookup)
const getWorkflowName = (workflowId: string): string => {
  const workflowNames: Record<string, string> = {
    'loop-over-rows': 'Loop Over Rows',
    'crawl4imprint': 'Crawl4Imprint',
    'blog-generator': 'AI Blog Generator',
    'csv-transformer': 'CSV Transformer',
    'sentiment-analyzer': 'Sentiment Analyzer',
    'image-processor': 'Image Processor',
    'price-monitor': 'Price Monitor',
  };
  
  return workflowNames[workflowId] || 'Unknown Workflow';
};

// Real-time execution updates (WebSocket simulation)
export const subscribeToExecutionUpdates = (
  executionId: string,
  callback: (execution: WorkflowExecution) => void
): (() => void) => {
  // In a real implementation, this would set up a WebSocket connection
  const interval = setInterval(async () => {
    const execution = await getExecution(executionId);
    if (execution) {
      callback(execution);
      
      // Stop polling when execution is complete
      if (['completed', 'failed', 'cancelled'].includes(execution.status)) {
        clearInterval(interval);
      }
    }
  }, 1000);
  
  // Return unsubscribe function
  return () => clearInterval(interval);
};

// Note: Removed mock initialization so the dashboard only reflects real in-memory executions from this session.