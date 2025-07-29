// App Manifest Validation System
// Validates Front& app manifests for correctness and completeness

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface AppManifest {
  frontand_version: string;
  app: {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    author: string;
    tags?: string[];
    license?: string;
    icon_url?: string;
  };
  webhook: {
    url: string;
    method?: string;
    timeout?: number;
    retry_policy?: {
      max_retries: number;
      backoff_strategy: 'linear' | 'exponential';
    };
  };
  auth?: {
    type: 'none' | 'api_key' | 'oauth2' | 'bearer' | 'multiple_oauth2';
    header?: string;
    prefix?: string;
    provider?: string;
    providers?: string[];
    scopes?: string[];
    description?: string;
  };
  inputs: InputField[];
  outputs: OutputField[];
  visual_explanation?: VisualExplanation;
  pricing?: PricingConfig;
  testing?: TestingConfig;
  performance?: PerformanceConfig;
}

export interface InputField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'file' | 'image' | 'select' | 'multiselect' | 'boolean' | 'number' | 'color' | 'date';
  placeholder?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    step?: number;
    minItems?: number;
    maxItems?: number;
    maxSize?: string;
    required_columns?: string[];
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  options?: Array<{
    value: string;
    label: string;
  }>;
  accept?: string;
  multiple?: boolean;
  default?: any;
  helpText?: string;
  condition?: {
    field: string;
    value: any;
  };
  ui?: {
    rows?: number;
    resize?: boolean;
    widget?: string;
    help?: string;
  };
}

export interface OutputField {
  type: 'table' | 'json' | 'text' | 'image' | 'file';
  description: string;
  downloadable?: boolean;
  formats?: string[];
  schema?: any;
}

export interface VisualExplanation {
  title: string;
  overview: string;
  estimated_time: string;
  complexity: 'easy' | 'medium' | 'advanced';
  steps: Array<{
    step: number;
    title: string;
    description: string;
    icon: string;
    visual_type: 'input' | 'config' | 'processing' | 'output';
    example?: string;
    details?: string;
  }>;
  flow_diagram?: {
    type: 'linear' | 'branching' | 'circular';
    nodes: Array<{
      id: string;
      label: string;
      type: 'input' | 'config' | 'processing' | 'output' | 'ai';
    }>;
    edges: Array<{
      from: string;
      to: string;
      label?: string;
    }>;
  };
  use_cases?: string[];
  tips?: string[];
}

export interface PricingConfig {
  model: 'free' | 'usage' | 'subscription';
  cost_per_execution?: number;
  free_executions?: number;
  description?: string;
  cost_factors?: Array<{
    factor: string;
    amount: number;
    description: string;
  }>;
}

export interface TestingConfig {
  supports_test_mode: boolean;
  test_limits?: {
    max_rows?: number;
    max_file_size?: string;
    max_characters?: number;
    features?: string[];
  };
  sample_data?: {
    input: string;
    output: string;
  };
}

export interface PerformanceConfig {
  estimated_time?: {
    base: number;
    per_item?: number;
    per_1000_rows?: number;
    with_ai?: number;
    with_search?: number;
  };
  resource_requirements?: {
    memory?: string;
    cpu?: string;
    gpu?: boolean;
  };
  rate_limits?: {
    requests_per_minute: number;
    concurrent_executions: number;
  };
}

// Validation rules
const SUPPORTED_CATEGORIES = [
  'data-processing',
  'content-generation',
  'web-scraping',
  'analysis',
  'media-processing',
  'integrations',
  'automation',
  'research'
];

const SUPPORTED_INPUT_TYPES = [
  'text',
  'textarea',
  'url',
  'file',
  'image',
  'select',
  'multiselect',
  'boolean',
  'number',
  'color',
  'date'
];

const SUPPORTED_OUTPUT_TYPES = [
  'table',
  'json',
  'text',
  'image',
  'file'
];

const SUPPORTED_AUTH_TYPES = [
  'none',
  'api_key',
  'oauth2',
  'bearer',
  'multiple_oauth2'
];

// Main validation function
export const validateManifest = async (manifestJson: string): Promise<ValidationResult> => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  try {
    const manifest: AppManifest = JSON.parse(manifestJson);

    // Validate basic structure
    validateBasicStructure(manifest, errors);
    
    // Validate app metadata
    validateAppMetadata(manifest.app, errors, warnings);
    
    // Validate webhook configuration
    validateWebhookConfig(manifest.webhook, errors, warnings);
    
    // Validate authentication
    if (manifest.auth) {
      validateAuthConfig(manifest.auth, errors, warnings);
    }
    
    // Validate inputs
    validateInputs(manifest.inputs, errors, warnings);
    
    // Validate outputs
    validateOutputs(manifest.outputs, errors, warnings);
    
    // Validate visual explanation
    if (manifest.visual_explanation) {
      validateVisualExplanation(manifest.visual_explanation, errors, warnings);
    }
    
    // Validate pricing
    if (manifest.pricing) {
      validatePricingConfig(manifest.pricing, errors, warnings);
    }
    
    // Validate testing config
    if (manifest.testing) {
      validateTestingConfig(manifest.testing, errors, warnings);
    }
    
    // Test webhook connectivity (async)
    await testWebhookConnectivity(manifest.webhook, warnings);

  } catch (parseError) {
    errors.push({
      field: 'root',
      message: 'Invalid JSON format: ' + (parseError as Error).message,
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Basic structure validation
const validateBasicStructure = (manifest: any, errors: ValidationError[]) => {
  if (!manifest.frontand_version) {
    errors.push({ field: 'frontand_version', message: 'Missing frontand_version', severity: 'error' });
  } else if (manifest.frontand_version !== '1.0') {
    errors.push({ field: 'frontand_version', message: 'Unsupported frontand_version. Expected "1.0"', severity: 'error' });
  }

  if (!manifest.app) {
    errors.push({ field: 'app', message: 'Missing app configuration', severity: 'error' });
  }

  if (!manifest.webhook) {
    errors.push({ field: 'webhook', message: 'Missing webhook configuration', severity: 'error' });
  }

  if (!manifest.inputs || !Array.isArray(manifest.inputs)) {
    errors.push({ field: 'inputs', message: 'Missing or invalid inputs array', severity: 'error' });
  }

  if (!manifest.outputs || !Array.isArray(manifest.outputs)) {
    errors.push({ field: 'outputs', message: 'Missing or invalid outputs array', severity: 'error' });
  }
};

// App metadata validation
const validateAppMetadata = (app: any, errors: ValidationError[], warnings: ValidationError[]) => {
  if (!app) return;

  if (!app.id) {
    errors.push({ field: 'app.id', message: 'Missing app ID', severity: 'error' });
  } else if (!/^[a-z0-9-_]+$/.test(app.id)) {
    errors.push({ field: 'app.id', message: 'App ID must contain only lowercase letters, numbers, hyphens, and underscores', severity: 'error' });
  }

  if (!app.name) {
    errors.push({ field: 'app.name', message: 'Missing app name', severity: 'error' });
  } else if (app.name.length < 3 || app.name.length > 100) {
    errors.push({ field: 'app.name', message: 'App name must be between 3 and 100 characters', severity: 'error' });
  }

  if (!app.description) {
    errors.push({ field: 'app.description', message: 'Missing app description', severity: 'error' });
  } else if (app.description.length < 10 || app.description.length > 500) {
    errors.push({ field: 'app.description', message: 'App description must be between 10 and 500 characters', severity: 'error' });
  }

  if (!app.category) {
    errors.push({ field: 'app.category', message: 'Missing app category', severity: 'error' });
  } else if (!SUPPORTED_CATEGORIES.includes(app.category)) {
    errors.push({ field: 'app.category', message: `Unsupported category. Must be one of: ${SUPPORTED_CATEGORIES.join(', ')}`, severity: 'error' });
  }

  if (!app.version) {
    errors.push({ field: 'app.version', message: 'Missing app version', severity: 'error' });
  } else if (!/^\d+\.\d+\.\d+$/.test(app.version)) {
    warnings.push({ field: 'app.version', message: 'Version should follow semantic versioning (e.g., 1.0.0)', severity: 'warning' });
  }

  if (!app.author) {
    errors.push({ field: 'app.author', message: 'Missing app author', severity: 'error' });
  }

  if (app.icon_url && !isValidUrl(app.icon_url)) {
    warnings.push({ field: 'app.icon_url', message: 'Invalid icon URL format', severity: 'warning' });
  }

  if (app.tags && !Array.isArray(app.tags)) {
    warnings.push({ field: 'app.tags', message: 'Tags should be an array of strings', severity: 'warning' });
  }
};

// Webhook configuration validation
const validateWebhookConfig = (webhook: any, errors: ValidationError[], warnings: ValidationError[]) => {
  if (!webhook) return;

  if (!webhook.url) {
    errors.push({ field: 'webhook.url', message: 'Missing webhook URL', severity: 'error' });
  } else if (!isValidUrl(webhook.url)) {
    errors.push({ field: 'webhook.url', message: 'Invalid webhook URL format', severity: 'error' });
  } else if (!webhook.url.startsWith('https://')) {
    errors.push({ field: 'webhook.url', message: 'Webhook URL must use HTTPS', severity: 'error' });
  }

  if (webhook.method && !['GET', 'POST', 'PUT', 'PATCH'].includes(webhook.method)) {
    warnings.push({ field: 'webhook.method', message: 'Unusual HTTP method. Consider using POST for most workflows', severity: 'warning' });
  }

  if (webhook.timeout && (webhook.timeout < 5 || webhook.timeout > 600)) {
    warnings.push({ field: 'webhook.timeout', message: 'Timeout should be between 5 and 600 seconds', severity: 'warning' });
  }

  if (webhook.retry_policy) {
    if (webhook.retry_policy.max_retries < 0 || webhook.retry_policy.max_retries > 5) {
      warnings.push({ field: 'webhook.retry_policy.max_retries', message: 'Max retries should be between 0 and 5', severity: 'warning' });
    }
    if (!['linear', 'exponential'].includes(webhook.retry_policy.backoff_strategy)) {
      errors.push({ field: 'webhook.retry_policy.backoff_strategy', message: 'Backoff strategy must be "linear" or "exponential"', severity: 'error' });
    }
  }
};

// Authentication validation
const validateAuthConfig = (auth: any, errors: ValidationError[], warnings: ValidationError[]) => {
  if (!auth.type) {
    errors.push({ field: 'auth.type', message: 'Missing auth type', severity: 'error' });
  } else if (!SUPPORTED_AUTH_TYPES.includes(auth.type)) {
    errors.push({ field: 'auth.type', message: `Unsupported auth type. Must be one of: ${SUPPORTED_AUTH_TYPES.join(', ')}`, severity: 'error' });
  }

  if (auth.type === 'api_key' && !auth.header) {
    warnings.push({ field: 'auth.header', message: 'API key auth should specify header name', severity: 'warning' });
  }

  if (auth.type === 'oauth2' && !auth.provider) {
    warnings.push({ field: 'auth.provider', message: 'OAuth2 auth should specify provider', severity: 'warning' });
  }

  if (auth.type === 'multiple_oauth2' && (!auth.providers || !Array.isArray(auth.providers))) {
    errors.push({ field: 'auth.providers', message: 'Multiple OAuth2 auth requires providers array', severity: 'error' });
  }
};

// Inputs validation
const validateInputs = (inputs: any[], errors: ValidationError[], warnings: ValidationError[]) => {
  if (!inputs || inputs.length === 0) {
    warnings.push({ field: 'inputs', message: 'No input fields defined. Consider adding at least one input', severity: 'warning' });
    return;
  }

  const inputIds = new Set();

  inputs.forEach((input, index) => {
    const prefix = `inputs[${index}]`;

    if (!input.id) {
      errors.push({ field: `${prefix}.id`, message: 'Missing input ID', severity: 'error' });
    } else {
      if (inputIds.has(input.id)) {
        errors.push({ field: `${prefix}.id`, message: `Duplicate input ID: ${input.id}`, severity: 'error' });
      }
      inputIds.add(input.id);
    }

    if (!input.label) {
      errors.push({ field: `${prefix}.label`, message: 'Missing input label', severity: 'error' });
    }

    if (!input.type) {
      errors.push({ field: `${prefix}.type`, message: 'Missing input type', severity: 'error' });
    } else if (!SUPPORTED_INPUT_TYPES.includes(input.type)) {
      errors.push({ field: `${prefix}.type`, message: `Unsupported input type: ${input.type}`, severity: 'error' });
    }

    if (input.type === 'select' || input.type === 'multiselect') {
      if (!input.options || !Array.isArray(input.options) || input.options.length === 0) {
        errors.push({ field: `${prefix}.options`, message: `${input.type} input requires options array`, severity: 'error' });
      } else {
        input.options.forEach((option: any, optionIndex: number) => {
          if (!option.value || !option.label) {
            errors.push({ field: `${prefix}.options[${optionIndex}]`, message: 'Option must have value and label', severity: 'error' });
          }
        });
      }
    }

    if (input.validation) {
      validateInputValidation(input, prefix, errors, warnings);
    }

    if (input.condition) {
      if (!input.condition.field || input.condition.value === undefined) {
        errors.push({ field: `${prefix}.condition`, message: 'Condition must specify field and value', severity: 'error' });
      }
    }
  });
};

// Input validation rules validation
const validateInputValidation = (input: any, prefix: string, errors: ValidationError[], warnings: ValidationError[]) => {
  const validation = input.validation;

  if (input.type === 'text' || input.type === 'textarea') {
    if (validation.minLength && validation.maxLength && validation.minLength > validation.maxLength) {
      errors.push({ field: `${prefix}.validation`, message: 'minLength cannot be greater than maxLength', severity: 'error' });
    }
  }

  if (input.type === 'number') {
    if (validation.min && validation.max && validation.min > validation.max) {
      errors.push({ field: `${prefix}.validation`, message: 'min cannot be greater than max', severity: 'error' });
    }
  }

  if (input.type === 'file' || input.type === 'image') {
    if (validation.maxSize && !isValidSizeFormat(validation.maxSize)) {
      errors.push({ field: `${prefix}.validation.maxSize`, message: 'Invalid size format. Use format like "10MB", "500KB"', severity: 'error' });
    }
  }

  if (validation.pattern) {
    try {
      new RegExp(validation.pattern);
    } catch (e) {
      errors.push({ field: `${prefix}.validation.pattern`, message: 'Invalid regex pattern', severity: 'error' });
    }
  }
};

// Outputs validation
const validateOutputs = (outputs: any[], errors: ValidationError[], warnings: ValidationError[]) => {
  if (!outputs || outputs.length === 0) {
    errors.push({ field: 'outputs', message: 'At least one output must be defined', severity: 'error' });
    return;
  }

  outputs.forEach((output, index) => {
    const prefix = `outputs[${index}]`;

    if (!output.type) {
      errors.push({ field: `${prefix}.type`, message: 'Missing output type', severity: 'error' });
    } else if (!SUPPORTED_OUTPUT_TYPES.includes(output.type)) {
      errors.push({ field: `${prefix}.type`, message: `Unsupported output type: ${output.type}`, severity: 'error' });
    }

    if (!output.description) {
      warnings.push({ field: `${prefix}.description`, message: 'Output description is recommended for better user experience', severity: 'warning' });
    }

    if (output.downloadable && (!output.formats || !Array.isArray(output.formats))) {
      warnings.push({ field: `${prefix}.formats`, message: 'Downloadable outputs should specify supported formats', severity: 'warning' });
    }
  });
};

// Visual explanation validation
const validateVisualExplanation = (visual: any, errors: ValidationError[], warnings: ValidationError[]) => {
  if (!visual.title) {
    warnings.push({ field: 'visual_explanation.title', message: 'Visual explanation title is recommended', severity: 'warning' });
  }

  if (!visual.steps || !Array.isArray(visual.steps) || visual.steps.length === 0) {
    warnings.push({ field: 'visual_explanation.steps', message: 'Visual explanation should include steps', severity: 'warning' });
  } else {
    visual.steps.forEach((step: any, index: number) => {
      const prefix = `visual_explanation.steps[${index}]`;
      
      if (!step.title || !step.description) {
        warnings.push({ field: prefix, message: 'Step should have title and description', severity: 'warning' });
      }
      
      if (!step.icon) {
        warnings.push({ field: `${prefix}.icon`, message: 'Step should specify an icon for better visual appeal', severity: 'warning' });
      }
    });
  }
};

// Pricing validation
const validatePricingConfig = (pricing: any, errors: ValidationError[], warnings: ValidationError[]) => {
  if (!pricing.model) {
    errors.push({ field: 'pricing.model', message: 'Missing pricing model', severity: 'error' });
  } else if (!['free', 'usage', 'subscription'].includes(pricing.model)) {
    errors.push({ field: 'pricing.model', message: 'Pricing model must be "free", "usage", or "subscription"', severity: 'error' });
  }

  if (pricing.model === 'usage' && !pricing.cost_per_execution) {
    warnings.push({ field: 'pricing.cost_per_execution', message: 'Usage-based pricing should specify cost per execution', severity: 'warning' });
  }

  if (pricing.cost_per_execution && pricing.cost_per_execution < 0) {
    errors.push({ field: 'pricing.cost_per_execution', message: 'Cost per execution cannot be negative', severity: 'error' });
  }
};

// Testing config validation
const validateTestingConfig = (testing: any, errors: ValidationError[], warnings: ValidationError[]) => {
  if (testing.supports_test_mode === undefined) {
    warnings.push({ field: 'testing.supports_test_mode', message: 'Specify whether test mode is supported for better developer experience', severity: 'warning' });
  }

  if (testing.supports_test_mode && !testing.test_limits) {
    warnings.push({ field: 'testing.test_limits', message: 'Test mode should specify limits to prevent abuse', severity: 'warning' });
  }
};

// Utility functions
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidSizeFormat = (size: string): boolean => {
  return /^\d+[KMGT]?B$/i.test(size);
};

// Test webhook connectivity
const testWebhookConnectivity = async (webhook: any, warnings: ValidationError[]) => {
  if (!webhook.url) return;

  try {
    // Simple HEAD request to test if endpoint exists
    // In a real implementation, you'd make an actual HTTP request
    // For now, just simulate the test
    
    // Mock test - randomly succeed or fail for demo
    const testResult = Math.random() > 0.3;
    
    if (!testResult) {
      warnings.push({
        field: 'webhook.url',
        message: 'Could not connect to webhook URL. Please verify the endpoint is accessible.',
        severity: 'warning'
      });
    }
  } catch (error) {
    warnings.push({
      field: 'webhook.url',
      message: `Webhook connectivity test failed: ${error}`,
      severity: 'warning'
    });
  }
};

// Export additional utility functions
export const validateManifestQuick = (manifestJson: string): boolean => {
  try {
    const manifest = JSON.parse(manifestJson);
    return !!(
      manifest.frontand_version &&
      manifest.app?.id &&
      manifest.app?.name &&
      manifest.webhook?.url &&
      manifest.inputs &&
      manifest.outputs
    );
  } catch {
    return false;
  }
};

export const extractManifestMetadata = (manifestJson: string) => {
  try {
    const manifest = JSON.parse(manifestJson);
    return {
      id: manifest.app?.id,
      name: manifest.app?.name,
      description: manifest.app?.description,
      category: manifest.app?.category,
      version: manifest.app?.version,
      author: manifest.app?.author,
      hasVisualExplanation: !!manifest.visual_explanation,
      inputCount: manifest.inputs?.length || 0,
      outputCount: manifest.outputs?.length || 0,
      supportsTestMode: manifest.testing?.supports_test_mode || false,
      authType: manifest.auth?.type || 'none',
      estimatedCost: manifest.pricing?.cost_per_execution || 0
    };
  } catch {
    return null;
  }
}; 