/**
 * CLOSED AI Workflow Input Types - JSON Standards
 * 
 * This library defines the standard input types for workflows in the CLOSED AI platform.
 * Creators can use these types to build consistent, reusable workflows.
 * 
 * @version 1.0.0
 * @author CLOSED AI Team
 */

export interface WorkflowInputSchema {
  version: string;
  inputs: WorkflowInput[];
  metadata?: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    author?: string;
    version?: string;
    estimatedTime?: string;
    pricing?: {
      baseCredits: number;
      perUnit?: number;
      unit?: string;
    };
  };
}

export interface WorkflowInput {
  id: string;
  type: InputType;
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  validation?: ValidationRule[];
  options?: any;
  conditional?: ConditionalRule;
  group?: string;
  order?: number;
}

export type InputType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'url'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'image'
  | 'date'
  | 'datetime'
  | 'time'
  | 'range'
  | 'color'
  | 'json'
  | 'code'
  | 'api_credentials'
  | 'oauth_token'
  | 'schedule'
  | 'array'
  | 'object'
  | 'custom';

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'email' | 'url' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: any) => boolean | string;
}

export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan';
  value: any;
}

// Standard Input Type Definitions
export const WORKFLOW_INPUT_TYPES = {
  /**
   * Basic Text Input
   * For short text inputs like names, titles, keywords
   */
  text: {
    type: 'text' as const,
    validation: [
      { type: 'maxLength', value: 500, message: 'Text must be under 500 characters' }
    ],
    options: {
      placeholder?: string;
      autocomplete?: boolean;
      suggestions?: string[];
    }
  },

  /**
   * Multi-line Text Area
   * For longer text inputs like descriptions, content, essays
   */
  textarea: {
    type: 'textarea' as const,
    validation: [
      { type: 'maxLength', value: 10000, message: 'Text must be under 10,000 characters' }
    ],
    options: {
      rows?: number;
      placeholder?: string;
      autoResize?: boolean;
      wordCount?: boolean;
    }
  },

  /**
   * Number Input
   * For numeric values with optional min/max constraints
   */
  number: {
    type: 'number' as const,
    validation: [
      { type: 'min', value: 0, message: 'Number must be positive' }
    ],
    options: {
      min?: number;
      max?: number;
      step?: number;
      decimals?: number;
    }
  },

  /**
   * Email Input
   * For email addresses with built-in validation
   */
  email: {
    type: 'email' as const,
    validation: [
      { type: 'email', message: 'Please enter a valid email address' }
    ],
    options: {
      multiple?: boolean;
      domains?: string[];
    }
  },

  /**
   * URL Input
   * For web URLs with validation
   */
  url: {
    type: 'url' as const,
    validation: [
      { type: 'url', message: 'Please enter a valid URL' }
    ],
    options: {
      protocols?: string[];
      requireProtocol?: boolean;
    }
  },

  /**
   * Select Dropdown
   * For choosing from a predefined list of options
   */
  select: {
    type: 'select' as const,
    options: {
      choices: Array<{ value: any; label: string; description?: string }>;
      searchable?: boolean;
      clearable?: boolean;
    }
  },

  /**
   * Multi-Select
   * For choosing multiple options from a list
   */
  multiselect: {
    type: 'multiselect' as const,
    options: {
      choices: Array<{ value: any; label: string; description?: string }>;
      max?: number;
      searchable?: boolean;
    }
  },

  /**
   * File Upload
   * For uploading files with type restrictions
   */
  file: {
    type: 'file' as const,
    validation: [
      { type: 'required', message: 'Please select a file' }
    ],
    options: {
      accept?: string[];
      maxSize?: number; // in MB
      multiple?: boolean;
      preview?: boolean;
    }
  },

  /**
   * Image Upload
   * Specialized file upload for images
   */
  image: {
    type: 'image' as const,
    validation: [
      { type: 'required', message: 'Please select an image' }
    ],
    options: {
      accept?: string[];
      maxSize?: number;
      dimensions?: { width: number; height: number };
      aspectRatio?: number;
      preview?: boolean;
    }
  },

  /**
   * API Credentials
   * For secure API key/token inputs
   */
  api_credentials: {
    type: 'api_credentials' as const,
    validation: [
      { type: 'required', message: 'API credentials are required' }
    ],
    options: {
      service?: string;
      fields?: Array<{ name: string; type: string; secure?: boolean }>;
      testConnection?: boolean;
    }
  },

  /**
   * OAuth Token
   * For OAuth authentication flows
   */
  oauth_token: {
    type: 'oauth_token' as const,
    options: {
      service: string;
      scopes?: string[];
      redirectUrl?: string;
    }
  },

  /**
   * Schedule Input
   * For scheduling workflows
   */
  schedule: {
    type: 'schedule' as const,
    options: {
      frequencies: Array<'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'>;
      timezone?: boolean;
      dateRange?: boolean;
    }
  },

  /**
   * Array Input
   * For dynamic lists of items
   */
  array: {
    type: 'array' as const,
    options: {
      itemType: InputType;
      itemSchema?: WorkflowInput;
      minItems?: number;
      maxItems?: number;
      addLabel?: string;
      removeLabel?: string;
    }
  },

  /**
   * Object Input
   * For complex nested objects
   */
  object: {
    type: 'object' as const,
    options: {
      properties: Record<string, WorkflowInput>;
      required?: string[];
      collapsible?: boolean;
    }
  },

  /**
   * JSON Input
   * For raw JSON data with validation
   */
  json: {
    type: 'json' as const,
    validation: [
      { type: 'custom', validator: (value: string) => {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return 'Invalid JSON format';
        }
      }}
    ],
    options: {
      schema?: object;
      pretty?: boolean;
      height?: number;
    }
  },

  /**
   * Code Input
   * For code snippets with syntax highlighting
   */
  code: {
    type: 'code' as const,
    options: {
      language?: string;
      theme?: string;
      lineNumbers?: boolean;
      height?: number;
    }
  }
};

// Example workflow schemas
export const EXAMPLE_WORKFLOWS = {
  /**
   * Keyword Clustering Workflow
   * Groups related keywords using AI
   */
  keywordClustering: {
    version: '1.0.0',
    metadata: {
      title: 'Keyword Clustering',
      description: 'Group related keywords automatically using AI clustering',
      category: 'Text Analysis',
      tags: ['keywords', 'clustering', 'seo'],
      author: 'CLOSED AI Team',
      estimatedTime: '30 seconds',
      pricing: {
        baseCredits: 0.5,
        perUnit: 0.01,
        unit: 'keyword'
      }
    },
    inputs: [
      {
        id: 'keywords',
        type: 'textarea',
        label: 'Keywords to Cluster',
        description: 'Enter keywords separated by commas or new lines',
        required: true,
        validation: [
          { type: 'required', message: 'Please enter at least one keyword' },
          { type: 'minLength', value: 3, message: 'Keywords must be at least 3 characters' }
        ],
        options: {
          placeholder: 'marketing, digital marketing, online marketing, social media, content marketing',
          rows: 6,
          wordCount: true
        }
      },
      {
        id: 'num_clusters',
        type: 'number',
        label: 'Number of Clusters',
        description: 'How many groups should the keywords be organized into?',
        default: 5,
        validation: [
          { type: 'min', value: 2, message: 'Minimum 2 clusters' },
          { type: 'max', value: 20, message: 'Maximum 20 clusters' }
        ],
        options: {
          min: 2,
          max: 20,
          step: 1
        }
      },
      {
        id: 'similarity_threshold',
        type: 'range',
        label: 'Similarity Threshold',
        description: 'How similar should keywords be to group together?',
        default: 0.7,
        validation: [
          { type: 'min', value: 0.1 },
          { type: 'max', value: 0.9 }
        ],
        options: {
          min: 0.1,
          max: 0.9,
          step: 0.1,
          marks: [
            { value: 0.3, label: 'Loose' },
            { value: 0.7, label: 'Balanced' },
            { value: 0.9, label: 'Strict' }
          ]
        }
      }
    ]
  } as WorkflowInputSchema,

  /**
   * Sentiment Analysis Workflow
   * Analyzes emotional tone in text
   */
  sentimentAnalysis: {
    version: '1.0.0',
    metadata: {
      title: 'Sentiment Analysis',
      description: 'Analyze the emotional tone and sentiment in text',
      category: 'NLP',
      tags: ['sentiment', 'emotion', 'analysis'],
      author: 'AI Labs',
      estimatedTime: '15 seconds',
      pricing: {
        baseCredits: 0.3,
        perUnit: 0.001,
        unit: 'character'
      }
    },
    inputs: [
      {
        id: 'text',
        type: 'textarea',
        label: 'Text to Analyze',
        description: 'Enter the text you want to analyze for sentiment',
        required: true,
        validation: [
          { type: 'required', message: 'Please enter some text to analyze' },
          { type: 'minLength', value: 10, message: 'Text must be at least 10 characters' },
          { type: 'maxLength', value: 5000, message: 'Text must be under 5,000 characters' }
        ],
        options: {
          placeholder: 'I love this product! It works exactly as described and the customer service was amazing.',
          rows: 8,
          wordCount: true
        }
      },
      {
        id: 'detailed_analysis',
        type: 'checkbox',
        label: 'Include Detailed Analysis',
        description: 'Get detailed breakdown of emotions, confidence scores, and key phrases',
        default: false
      },
      {
        id: 'language',
        type: 'select',
        label: 'Text Language',
        description: 'Select the language of your text for better accuracy',
        default: 'en',
        options: {
          choices: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
            { value: 'it', label: 'Italian' },
            { value: 'pt', label: 'Portuguese' },
            { value: 'auto', label: 'Auto-detect' }
          ],
          searchable: true
        }
      }
    ]
  } as WorkflowInputSchema,

  /**
   * Google Sheets Integration
   * Example with OAuth authentication
   */
  googleSheetsIntegration: {
    version: '1.0.0',
    metadata: {
      title: 'Google Sheets Data Import',
      description: 'Import and process data from Google Sheets',
      category: 'Integration',
      tags: ['google', 'sheets', 'import'],
      author: 'DataPro',
      estimatedTime: '45 seconds',
      pricing: {
        baseCredits: 0.8,
        perUnit: 0.1,
        unit: 'row'
      }
    },
    inputs: [
      {
        id: 'google_auth',
        type: 'oauth_token',
        label: 'Google Authentication',
        description: 'Connect your Google account to access sheets',
        required: true,
        options: {
          service: 'google',
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        }
      },
      {
        id: 'sheet_url',
        type: 'url',
        label: 'Google Sheets URL',
        description: 'URL of the Google Sheet you want to import',
        required: true,
        validation: [
          { type: 'required', message: 'Please enter a Google Sheets URL' },
          { type: 'pattern', value: /docs\.google\.com\/spreadsheets/, message: 'Must be a valid Google Sheets URL' }
        ],
        options: {
          placeholder: 'https://docs.google.com/spreadsheets/d/1ABC123.../edit'
        }
      },
      {
        id: 'sheet_name',
        type: 'text',
        label: 'Sheet Name',
        description: 'Name of the specific sheet/tab to import (leave blank for first sheet)',
        options: {
          placeholder: 'Sheet1'
        }
      },
      {
        id: 'range',
        type: 'text',
        label: 'Cell Range',
        description: 'Specific range to import (e.g., A1:E100) or leave blank for all data',
        options: {
          placeholder: 'A1:E100'
        }
      }
    ]
  } as WorkflowInputSchema
};

// Validation helper functions
export class WorkflowValidator {
  static validateSchema(schema: WorkflowInputSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema.version) {
      errors.push('Schema version is required');
    }

    if (!schema.inputs || !Array.isArray(schema.inputs)) {
      errors.push('Inputs array is required');
    } else {
      schema.inputs.forEach((input, index) => {
        if (!input.id) {
          errors.push(`Input ${index}: ID is required`);
        }
        if (!input.type) {
          errors.push(`Input ${index}: Type is required`);
        }
        if (!input.label) {
          errors.push(`Input ${index}: Label is required`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateInput(input: WorkflowInput, value: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required validation
    if (input.required && (value === undefined || value === null || value === '')) {
      errors.push(`${input.label} is required`);
      return { valid: false, errors };
    }

    // Type-specific validation
    if (value !== undefined && value !== null && value !== '') {
      switch (input.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${input.label} must be a valid email address`);
          }
          break;
        case 'url':
          try {
            new URL(value);
          } catch {
            errors.push(`${input.label} must be a valid URL`);
          }
          break;
        case 'number':
          if (isNaN(value)) {
            errors.push(`${input.label} must be a number`);
          }
          break;
      }
    }

    // Custom validation rules
    if (input.validation) {
      input.validation.forEach(rule => {
        switch (rule.type) {
          case 'minLength':
            if (value && value.length < rule.value) {
              errors.push(rule.message || `${input.label} must be at least ${rule.value} characters`);
            }
            break;
          case 'maxLength':
            if (value && value.length > rule.value) {
              errors.push(rule.message || `${input.label} must be under ${rule.value} characters`);
            }
            break;
          case 'min':
            if (value < rule.value) {
              errors.push(rule.message || `${input.label} must be at least ${rule.value}`);
            }
            break;
          case 'max':
            if (value > rule.value) {
              errors.push(rule.message || `${input.label} must be at most ${rule.value}`);
            }
            break;
          case 'pattern':
            if (value && !rule.value.test(value)) {
              errors.push(rule.message || `${input.label} format is invalid`);
            }
            break;
          case 'custom':
            if (rule.validator) {
              const result = rule.validator(value);
              if (result !== true) {
                errors.push(typeof result === 'string' ? result : rule.message || `${input.label} is invalid`);
              }
            }
            break;
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Helper function to create workflow input
export function createWorkflowInput(
  id: string,
  type: InputType,
  label: string,
  options: Partial<WorkflowInput> = {}
): WorkflowInput {
  return {
    id,
    type,
    label,
    ...options
  };
}

// Helper function to create workflow schema
export function createWorkflowSchema(
  inputs: WorkflowInput[],
  metadata: WorkflowInputSchema['metadata'] = {}
): WorkflowInputSchema {
  return {
    version: '1.0.0',
    inputs,
    metadata
  };
} 