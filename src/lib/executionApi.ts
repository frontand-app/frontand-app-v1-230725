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
    const files = generateMockFiles(execution.workflowId, testMode);
    const costCredits = calculateMockCost(execution.workflowId, execution.inputData, testMode);

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
const generateMockFiles = (workflowId: string, testMode: boolean): ExecutionFile[] => {
  const baseUrl = '/api/executions/files/';
  
  switch (workflowId) {
    case 'loop-over-rows':
      return [
        {
          id: 'file_' + Date.now(),
          name: testMode ? 'test_results.csv' : 'processed_data.csv',
          type: 'csv',
          size: testMode ? 1420 : 45680,
          downloadUrl: `${baseUrl}processed_data.csv`,
          createdAt: new Date().toISOString()
        },
        {
          id: 'file_' + (Date.now() + 1),
          name: 'analysis_summary.json',
          type: 'json',
          size: testMode ? 892 : 8932,
          downloadUrl: `${baseUrl}analysis_summary.json`,
          createdAt: new Date().toISOString()
        }
      ];
    
    case 'crawl4imprint':
      return [
        {
          id: 'file_' + Date.now(),
          name: testMode ? 'test_legal_data.csv' : 'legal_compliance_data.csv',
          type: 'csv',
          size: testMode ? 2150 : 67890,
          downloadUrl: `${baseUrl}legal_compliance_data.csv`,
          createdAt: new Date().toISOString()
        }
      ];
    
    case 'blog-generator':
      return [
        {
          id: 'file_' + Date.now(),
          name: 'generated_blog_post.md',
          type: 'md',
          size: testMode ? 3240 : 15670,
          downloadUrl: `${baseUrl}generated_blog_post.md`,
          createdAt: new Date().toISOString()
        },
        {
          id: 'file_' + (Date.now() + 1),
          name: 'seo_metadata.json',
          type: 'json',
          size: 567,
          downloadUrl: `${baseUrl}seo_metadata.json`,
          createdAt: new Date().toISOString()
        }
      ];
    
    default:
      return [
        {
          id: 'file_' + Date.now(),
          name: testMode ? 'test_output.json' : 'results.json',
          type: 'json',
          size: testMode ? 1200 : 12400,
          downloadUrl: `${baseUrl}results.json`,
          createdAt: new Date().toISOString()
        }
      ];
  }
};

// Calculate mock cost based on workflow and input data
const calculateMockCost = (workflowId: string, inputData: any, testMode: boolean): number => {
  if (testMode) return 0; // No cost for test mode
  
  let baseCost = 0.05;
  
  switch (workflowId) {
    case 'loop-over-rows':
      // Cost based on number of rows
      const estimatedRows = inputData.csv_data ? 100 : 10;
      baseCost = 0.02 + (estimatedRows * 0.001);
      break;
    
    case 'blog-generator':
      // Cost based on length
      const lengthMultiplier = inputData.length === 'long' ? 2 : inputData.length === 'comprehensive' ? 3 : 1;
      baseCost = 0.08 * lengthMultiplier;
      break;
    
    case 'crawl4imprint':
      // Cost based on number of sites
      const estimatedSites = inputData.websites ? 25 : 5;
      baseCost = 0.03 + (estimatedSites * 0.002);
      break;
    
    default:
      baseCost = 0.05;
  }
  
  return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
};

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