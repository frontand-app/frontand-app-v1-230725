import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, AlertCircle, Upload, FileText, Search, Globe, BarChart3, Sparkles, File, CheckCircle2, X, ChevronDown, Check, Clock, Lightbulb, Info, ArrowRight, AlertTriangle, Shield, TrendingUp, Heart, Eye, ArrowDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { TableOutput, TableData } from '@/components/TableOutput';
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Workflow Configuration Types
export interface WorkflowField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'file' | 'csv' | 'image' | 'number' | 'select' | 'multiselect';
  placeholder?: string;
  required?: boolean;
  accept?: string; // For file inputs
  options?: Array<{id: string, label: string, value: any}>; // For select inputs
  validation?: (value: any) => string | null;
  helpText?: string;
}

export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  prompt?: string;
  sampleData?: any;
}

export interface VisualStep {
  step: number;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  type: 'input' | 'config' | 'processing' | 'output';
  example?: string;
  details?: string;
}

export interface VisualExplanation {
  title?: string;
  overview?: string;
  estimatedTime?: string;
  complexity?: 'easy' | 'medium' | 'advanced';
  steps: VisualStep[];
  useCases?: string[];
  tips?: string[];
}

export interface WorkflowConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{className?: string}>;
  color: string; // CSS class suffix (e.g., 'blue', 'green')
  status: 'live' | 'coming-soon';
  category?: string;
  
  // Input Configuration
  inputs: WorkflowField[];
  templates?: WorkflowTemplate[];
  
  // Processing Configuration
  endpoint: string;
  supportsGoogleSearch?: boolean;
  supportsTestMode?: boolean;
  // Optional modes for single-app multi-mode UX
  modes?: Array<{ id: string; label: string; endpointOverride?: string }>;
  defaultModeId?: string;
  
  // Timing estimates (in seconds)
  estimatedTime: {
    base: number; // Base time
    perItem?: number; // Additional time per item
    withSearch?: number; // Additional time with Google Search
  };
  
  // Output Configuration
  outputType: 'table' | 'json' | 'text' | 'image' | 'file';
  downloadable?: boolean;
  
  // Visual Explanation
  visualExplanation?: VisualExplanation;
}

interface WorkflowBaseProps {
  config: WorkflowConfig;
}

const WorkflowBase: React.FC<WorkflowBaseProps> = ({ config }) => {
  // Mode state (for apps that support modes, e.g., loop-over-rows)
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = (urlParams.get('mode') || (config as any).defaultModeId || 'freestyle');
  const [mode, setMode] = useState<string>(initialMode);
  // Core state
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [step, setStep] = useState(1); // 1: empty form, 2: filled form, 3: results
  
  // Input states - dynamic based on config
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [testMode, setTestMode] = useState(false);
  const [enableGoogleSearch, setEnableGoogleSearch] = useState(false);
  
  // UI states
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhrase, setLoadingPhrase] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [openTemplates, setOpenTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedCsvColumns, setSelectedCsvColumns] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleMockModeToggle = (isMockMode: boolean) => {
    setTestMode(isMockMode);
    if (isMockMode && (config.id === 'loop-over-rows' && mode === 'keyword-kombat')) {
      setInputValues({
        keywords: 'music\nstreaming\nsubscription',
        company_url: 'https://www.spotify.com/',
        keyword_variable: 'keyword'
      });
      setUploadedFile({ name: 'company_list_august2025.csv (35KB)' } as File);
      setStep(2);
      setError(null);
    } else if (isMockMode && (config.id === 'loop-over-rows' && mode === 'freestyle')) {
      const mockCsv = 'name,email,website\nAlice,alice@example.com,https://acme.com\nBob,bob@example.com,https://example.org';
      setInputValues({
        csv_data: mockCsv,
        prompt: 'For each row, return JSON with: name, email_domain, company_industry (guess).',
        output_schema: `## OUTPUT\n{\n  "name": "...",\n  "email_domain": "...",\n  "company_industry": "..."\n}`
      });
      try {
        const parsed = parseCSVData(mockCsv);
        if (parsed) {
          setCsvHeaders(parsed.headers);
          setSelectedCsvColumns(parsed.headers);
        }
      } catch {}
      setUploadedFile({ name: 'sample.csv' } as File);
      setError(null);
    } else {
      setInputValues({});
      setUploadedFile(null);
      setStep(1);
      setError(null);
    }
  };

  // Keep column chips in sync when user pastes CSV instead of uploading a file
  useEffect(() => {
    try {
      if (config.id === 'loop-over-rows' && mode === 'freestyle' && inputValues.csv_data) {
        const parsed = parseCSVData(inputValues.csv_data);
        if (parsed) {
          setCsvHeaders(parsed.headers);
          if (selectedCsvColumns.length === 0) setSelectedCsvColumns(parsed.headers);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValues.csv_data, mode]);

  // Dynamic loading phrases based on workflow
  const getLoadingPhrases = () => {
    const basePhases = [
      "🚀 Initializing AI processing...",
      "📊 Analyzing your input...",
      "🧠 Understanding requirements...",
    ];
    
    const searchPhases = enableGoogleSearch ? [
      "🔍 Searching the web for current information...",
      "🌐 Gathering real-time data...",
      "📈 Cross-referencing with latest data..."
    ] : [];
    
    const processingPhases = [
      "⚡ Processing with advanced AI...",
      "🎯 Generating intelligent results...",
      "📝 Formatting output...",
      "✨ Finalizing results..."
    ];
    
    return [...basePhases, ...searchPhases, ...processingPhases];
  };

  // Calculate estimated time
  const getEstimatedTime = () => {
    const itemCount = getItemCount();
    const baseTime = config.estimatedTime.base;
    const perItemTime = (config.estimatedTime.perItem ?? 0) * itemCount;
    const searchTime = enableGoogleSearch ? (config.estimatedTime.withSearch ?? 0) : 0;
    
    const totalTime = baseTime + perItemTime + searchTime;
    const minTime = Math.max(5, Math.round(totalTime * 0.8));
    const maxTime = Math.round(totalTime * 1.2);
    
    return { min: minTime, max: maxTime };
  };

  // Get item count for processing estimate
  const getItemCount = () => {
    // For CSV workflows, count rows
    const activeInputs = getActiveInputs();
    const csvField = activeInputs.find(field => field.type === 'csv');
    if (csvField && inputValues[csvField.id]) {
      const lines = inputValues[csvField.id].trim().split('\n');
      return testMode ? 1 : Math.max(0, lines.length - 1); // Subtract header
    }
    
    // For other workflows, assume 1 item
    return testMode ? 1 : 1;
  };

  // Loading animation effect
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let phraseInterval: NodeJS.Timeout;
    let startupTimeout: NodeJS.Timeout;
    
    if (isExecuting) {
      const phrases = getLoadingPhrases();
      let currentPhraseIndex = 0;
      let currentProgress = 0;
      
      // Start loading immediately
      setLoadingProgress(5);
      setLoadingPhrase(phrases[0]);
      
      // Phrase cycling
      phraseInterval = setInterval(() => {
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        setLoadingPhrase(phrases[currentPhraseIndex]);
      }, 3000);
      
      // Progress animation
      startupTimeout = setTimeout(() => {
        progressInterval = setInterval(() => {
          currentProgress += 1;
          
          const progressSpeed = currentProgress < 20 ? 0.8 : 
                              currentProgress < 60 ? 1.5 : 
                              currentProgress < 80 ? 1.0 : 0.3;
          
          currentProgress += progressSpeed + (Math.random() * 0.4);
          if (currentProgress > 85) currentProgress = 85;
          
          setLoadingProgress(currentProgress);
        }, 400);
      }, 500);
    } else {
      setLoadingProgress(0);
      setLoadingPhrase('');
    }
    
    return () => {
      if (startupTimeout) clearTimeout(startupTimeout);
      if (progressInterval) clearInterval(progressInterval);
      if (phraseInterval) clearInterval(phraseInterval);
    };
  }, [isExecuting, enableGoogleSearch]);

  // Handle input changes
  const handleInputChange = (fieldId: string, value: any) => {
    setInputValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    setError(null);
  };

  // Handle template selection
  const handleTemplateSelect = (template: WorkflowTemplate) => {
    if (template.prompt) {
      const promptField = config.inputs.find(field => field.type === 'textarea' && field.id.includes('prompt'));
      if (promptField) {
        handleInputChange(promptField.id, template.prompt);
      }
    }
    
    if (template.sampleData) {
      // Apply sample data to appropriate fields
      Object.entries(template.sampleData).forEach(([key, value]) => {
        handleInputChange(key, value);
      });
    }
    
    setSelectedTemplate(template.title);
    setOpenTemplates(false);
  };

  // Process uploaded CSV file
  const processFile = (file: File, fieldId: string) => {
    if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleInputChange(fieldId, content);
      setUploadedFile(file);
      // derive headers preview
      const firstLine = content.split('\n')[0] || '';
      const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      setCsvHeaders(headers);
      setSelectedCsvColumns(headers); // default: all columns selected
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  // Validate inputs
  const validateInputs = (): string | null => {
    const activeInputs = getActiveInputs();
    for (const field of activeInputs) {
      if (field.required && !inputValues[field.id]) {
        return `${field.label} is required`;
      }
      
      if (field.validation && inputValues[field.id]) {
        const validationError = field.validation(inputValues[field.id]);
        if (validationError) {
          return validationError;
        }
      }
    }
    return null;
  };

  // Parse CSV data into the format expected by the backend
  const parseCSVData = (csvString: string) => {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return null;
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      // Handle quoted fields properly
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    });
    
    return { headers, rows };
  };

  // Handle execution
  const handleExecute = async () => {
    // Handle mock mode first for keyword-kombat, as it fills the form
    if (config.id === 'loop-over-rows' && mode === 'keyword-kombat' && testMode && step === 2) {
      setResults([
        { keyword: "music", score: "0.8", reasoning: "Music is a core focus of the platform, central to its..." },
        { keyword: "streaming", score: "0.95", reasoning: "The company is explicitly described as a streamin..." },
        { keyword: "subscription", score: "0.85", reasoning: "The business model is primarily subscription-based." },
        { keyword: "AI", score: "0.3", reasoning: "No mention of AI; possible light use in personaliza..." },
        { keyword: "ads", score: "0.2", reasoning: "Ads are part of the freemium model, but not emph..." },
        { keyword: "blockchain", score: "0", reasoning: "No mention or implication of blockchain or crypto-..." },
        { keyword: "mobile app", score: "0.6", reasoning: "Spotify's core user experience is delivered via a m..." }
      ]);
      setShowResults(true);
      setStep(3);
      return;
    }

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setResults(null);
    setError(null);
    setShowResults(false);
    setIsExecuting(true);
    setLoadingProgress(5);
    setLoadingPhrase(getLoadingPhrases()[0]);

    try {
      // Prepare request data with special handling for CSV workflows
      let requestData: any = {
        test_mode: testMode,
        enable_google_search: enableGoogleSearch,
        mode: config.id === 'loop-over-rows' ? mode : undefined
      };

      // Special handling for loop-over-rows freestyle (CSV + prompt)
      if (config.id === 'loop-over-rows' && mode === 'freestyle' && inputValues.csv_data && inputValues.prompt) {
        const parsedData = parseCSVData(inputValues.csv_data);
        if (!parsedData) {
          throw new Error('Invalid CSV data format');
        }

        // Filter columns based on user selection (default is all)
        const activeHeaders = selectedCsvColumns.length > 0 ? selectedCsvColumns : parsedData.headers;
        const headerIndices = activeHeaders.map(h => parsedData.headers.indexOf(h)).filter(i => i >= 0);

        // Format data for Modal API - convert CSV to row-keyed array format
        const rowsToProcess = testMode ? parsedData.rows.slice(0, 1) : parsedData.rows;
        
        // Convert rows to row-keyed array format as expected by Modal
        const dataDict: Record<string, string[]> = {};
        rowsToProcess.forEach((row, index) => {
          const rowKey = `row_${index + 1}`;
          const filteredRow = headerIndices.map(i => row[i]);
          dataDict[rowKey] = filteredRow;
        });
        
        requestData = {
          data: dataDict,
          headers: activeHeaders,
          prompt: inputValues.prompt.trim(),
          output_schema: inputValues.output_schema,
          batch_size: 10,
          enable_google_search: enableGoogleSearch,
          mode: 'freestyle'
        };
      } else if (config.id === 'loop-over-rows' && mode === 'keyword-kombat' && inputValues.keywords && inputValues.company_url) {
        // Keyword Kombat mode
        const lines = inputValues.keywords.trim().split('\n').filter((l: string) => l.trim().length > 0);
        const dataDict: Record<string, string[]> = {};
        const headers = ['Keyword'];
        (testMode ? lines.slice(0, 3) : lines).forEach((kw: string, index: number) => {
          dataDict[`row_${index + 1}`] = [kw.trim()];
        });
        requestData = {
          mode: 'keyword-kombat',
          keywords: lines,
          company_url: inputValues.company_url,
          keyword_variable: inputValues.keyword_variable || 'keyword',
          test_mode: testMode,
          enable_google_search: enableGoogleSearch
        };
      } else if (config.id === 'crawl4imprint' && inputValues.websites) {
        // Special handling for crawl4imprint workflow
        let websitesList: string[] = [];
        
        // Handle CSV data or plain text
        const websitesInput = inputValues.websites.trim();
        if (websitesInput.includes(',') && websitesInput.includes('\n')) {
          // Looks like CSV data - parse it
          const lines = websitesInput.split('\n');
          const hasHeaders = lines[0].toLowerCase().includes('website') || lines[0].toLowerCase().includes('url');
          const dataLines = hasHeaders ? lines.slice(1) : lines;
          
          websitesList = dataLines
            .map(line => {
              // Handle CSV format - take first column or the whole line if no commas
              const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
              return columns[0];
            })
            .filter(url => url.length > 0 && url.startsWith('http'));
        } else {
          // Plain text format - one URL per line
          websitesList = websitesInput
            .split('\n')
            .map((url: string) => url.trim())
            .filter((url: string) => url.length > 0);
        }
        
        if (websitesList.length === 0) {
          throw new Error('Please provide at least one valid website URL');
        }

        requestData = {
          websites: websitesList,
          test_mode: testMode,
          enable_google_search: enableGoogleSearch
        };
      } else {
        // Standard workflow - just pass through input values
        requestData = {
          ...inputValues,
          test_mode: testMode,
          enable_google_search: enableGoogleSearch,
          ...(config.id === 'loop-over-rows' ? { mode } : {})
        };
      }

      console.log('Sending request to:', config.endpoint, requestData);

      // Endpoint: allow per-mode override while we unify backend
      // Single unified endpoint handles all modes
      const endpointToUse = config.endpoint;
      const response = await fetch(endpointToUse, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      // Smooth completion
      setLoadingProgress(95);
      setLoadingPhrase("✅ Processing complete!");
      
      setTimeout(() => {
        setLoadingProgress(100);
      }, 300);
      
      setTimeout(() => {
        setIsExecuting(false);
        setResults(result);
        setShowResults(true);
      }, 800);
      
    } catch (err: any) {
      console.error('Execution error:', err);
      setError(err.message || 'Failed to execute workflow');
      setIsExecuting(false);
      setLoadingProgress(0);
      setLoadingPhrase('');
    }
  };

  // Determine inputs based on mode for loop-over-rows
  const getActiveInputs = (): WorkflowField[] => {
    if (config.id !== 'loop-over-rows') return config.inputs;
    if (mode === 'freestyle') return config.inputs;
    // keyword-kombat inputs
    return [
      { id: 'keywords', label: 'Keywords', type: 'csv', required: true, placeholder: 'music\nstreaming\nsubscription', helpText: 'Upload a file or paste a list with the keywords you would like to rank*' },
      { id: 'company_url', label: 'Company URL', type: 'url', required: true, placeholder: 'https://www.spotify.com/' },
      { id: 'keyword_variable', label: 'Map keyword variable', type: 'select', required: true, options: [{ id: 'keyword', label: 'keyword', value: 'keyword' }] }
    ];
  };

  // Render input field
  const renderInputField = (field: WorkflowField) => {
    const value = inputValues[field.id] || '';
    
    switch (field.type) {
      case 'text':
      case 'url':
      case 'number':
        return (
          <Input
            id={field.id}
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="focus:ring-2 focus:ring-gray-300 border-gray-200"
          />
        );
        
      case 'textarea':
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="min-h-[80px] resize-none focus:ring-2 focus:ring-gray-300 border-gray-200"
          />
        );
        
      case 'file':
      case 'image':
        return (
          <div className="space-y-3">
            <Input
              id={field.id}
              type="file"
              accept={field.accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleInputChange(field.id, file);
                }
              }}
              className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {value && (
              <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                {value.name || 'File selected'}
              </div>
            )}
          </div>
        );
        
      case 'csv':
        return (
          <div className="space-y-3">
            <div className="flex gap-2 text-xs text-gray-500 mb-2">
              <button 
                type="button"
                onClick={() => {/* Switch to text input - textarea is always visible */}}
                className="text-gray-600 hover:text-gray-800"
              >
                Text Input
              </button>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">File Upload</span>
            </div>
            
            {/* CSV Textarea Input */}
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => {
                handleInputChange(field.id, e.target.value);
                setUploadedFile(null); // Clear uploaded file when typing
              }}
              className="min-h-[120px] resize-none focus:ring-2 focus:ring-gray-300 border-gray-200 font-mono text-sm"
            />

            {/* CSV File Upload */}
            <div className="relative">
              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                  dragActive 
                    ? 'border-gray-400 bg-gray-50' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                  
                  const files = e.dataTransfer.files;
                  if (files?.[0]) {
                    processFile(files[0], field.id);
                  }
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      processFile(file, field.id);
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {uploadedFile ? 'Click to replace file' : 'Drop your CSV file here or click to upload'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports CSV files up to 10MB
                </p>
              </div>

              {uploadedFile && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border mt-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">{uploadedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      handleInputChange(field.id, '');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {value && (
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border">
                <FileText className="w-4 h-4 inline mr-2" />
                {value.split('\n').length} lines detected
              </div>
            )}
          </div>
        );
        
      case 'select':
        return (
          <select
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-gray-300"
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map(option => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-600 mb-2">
              {selectedValues.length} selected
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
              {field.options?.map(option => (
                <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter(v => v !== option.value);
                      handleInputChange(field.id, newValue);
                    }}
                    className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-300"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render results based on output type
  const renderResults = () => {
    if (!showResults || !results) return null;
    
    switch (config.outputType) {
      case 'table':
        // Handle table data - extract results.results for loop-over-rows workflow
        const tableData = results.results || results;
        
        if (!Array.isArray(tableData) || tableData.length === 0) {
          return (
            <div className="text-center py-8 text-gray-500">
              <p>No data to display</p>
            </div>
          );
        }

        // Transform API response into TableOutput format
        const tableOutputData = {
          columns: Object.keys(tableData[0] || {}).map(key => ({
            key,
            label: key === results.output_column_name 
              ? results.output_column_name.replace(/_/g, ' ')
              : key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            type: 'text' as const,
            sortable: true
          })),
          rows: tableData
        };

        // Calculate confidence score (mock for now - in real app this would come from AI)
        const mockConfidenceScore = Math.min(95, Math.max(75, 85 + Math.random() * 15));
        const processingTime = results.processing_time || (tableData.length * 2.5).toFixed(1);

        return (
          <div className="space-y-3">
            {/* Enhanced Results Summary with Confidence */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">
              Processed {tableData.length} row(s) successfully
                  </span>
                </div>
                
                {/* Confidence Score */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {mockConfidenceScore.toFixed(0)}% confident
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {processingTime}s
                  </div>
                </div>
              </div>
              
              {/* Quality Indicators */}
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-gray-600">High quality results</span>
                </div>
                {mockConfidenceScore < 85 && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span className="text-yellow-700">Some results may need review</span>
                  </div>
                )}
              {results.output_column_name && (
                <span className="text-gray-500">
                    Output: {results.output_column_name.replace(/_/g, ' ')}
                </span>
              )}
              </div>
            </div>
            
            {/* Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <TableOutput 
                data={tableOutputData}
                enableSearch={true}
                enableExport={true}
              />
            </div>
          </div>
        );
        
      case 'json':
        return (
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        );
        
      case 'text':
        return (
          <div className="bg-gray-50 p-4 rounded-lg">
            {typeof results === 'string' ? results : JSON.stringify(results)}
          </div>
        );
        
      case 'image':
        return (
          <div className="text-center">
            <img 
              src={results.url || results.image_url} 
              alt="Generated result" 
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
            {config.downloadable && (
              <Button 
                className="mt-4" 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = results.url || results.image_url;
                  link.download = 'result.png';
                  link.click();
                }}
              >
                Download Image
              </Button>
            )}
          </div>
        );
        
      default:
        return <div className="bg-gray-50 p-4 rounded-lg">Results: {JSON.stringify(results)}</div>;
    }
  };

  // Get icon component by name
  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Info className="h-4 w-4" />;
  };



  const getStepIcon = (type: string) => {
    switch (type) {
      case 'input': return 'ArrowUp';
      case 'config': return 'Settings';
      case 'processing': return 'Zap';
      case 'output': return 'ArrowDown';
      default: return 'Circle';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-secondary rounded-full px-3 py-1 text-sm">
            {config.category}
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{config.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">4K</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">16K</span>
            </div>
          </div>
        </div>
        {/* Mode picker for loop-over-rows */}
        {config.id === 'loop-over-rows' && (config as any).modes && (
          <div className="mb-4">
            <div className="inline-flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Mode</span>
              <Select value={mode} onValueChange={(v) => setMode(v)}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select a mode" />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-auto">
                  {((config as any).modes || []).map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <p className="text-muted-foreground mb-6">
            {config.description}
          </p>

        {config.supportsTestMode && (
          <div className="flex items-center gap-3 mb-8">
            <Switch 
              checked={testMode} 
              onCheckedChange={handleMockModeToggle}
              className="data-[state=checked]:bg-foreground"
            />
            <span className="font-medium text-foreground">Mock mode</span>
            <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
        )}

        {/* Google Search Toggle for keyword-kombat mode */}
        {config.id === 'loop-over-rows' && (mode === 'keyword-kombat') && (
          <div className="flex items-center gap-3 mb-8">
            <Switch 
              checked={enableGoogleSearch} 
              onCheckedChange={setEnableGoogleSearch}
              className="data-[state=checked]:bg-primary"
            />
            <span className="font-medium text-foreground">Google Search</span>
            <div className="flex items-center gap-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Enhanced company research</span>
            </div>
        </div>
        )}
        {config.id === 'loop-over-rows' && (mode === 'freestyle') && (
          <div className="flex items-center gap-3 mb-8">
            <Switch 
              checked={enableGoogleSearch} 
              onCheckedChange={setEnableGoogleSearch}
              className="data-[state=checked]:bg-primary"
            />
            <span className="font-medium text-foreground">Google Search</span>
            <div className="flex items-center gap-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Optional web enrichment</span>
            </div>
          </div>
        )}

        {/* How it works removed for simpler above-the-fold layout */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto items-stretch content-stretch">
          {/* INPUT SECTION */}
          <div className="space-y-6">
            <Card className="border-2 border-primary rounded-2xl h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="bg-primary text-primary-foreground rounded-lg px-3 py-1 text-sm font-medium inline-block mb-6">
                  YOUR INPUT
                </div>

                <div className="space-y-6">
                        <div>
                    <h3 className="font-medium text-foreground mb-4">
                      {config.id === 'loop-over-rows' && mode === 'keyword-kombat'
                        ? (step >= 2 ? 'Upload your CSV file with the keywords you would like to rank*' : 'Upload a file or paste a list with the keywords you would like to rank*')
                        : 'Upload CSV data'}
                    </h3>
                    
                    {config.id === 'loop-over-rows' && mode === 'keyword-kombat' && step >= 2 && uploadedFile ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-foreground">Keyword</div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {inputValues.keywords.split('\n').map((keyword: string, idx: number) => (
                            <div key={idx}>{keyword}</div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-sm text-foreground">✓ {uploadedFile.name}</span>
                          <Button variant="outline" size="sm">Upload new</Button>
                      </div>
                    </div>
                    ) : config.id === 'loop-over-rows' && mode === 'keyword-kombat' ? (
                      <>
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                          <p className="font-medium text-foreground mb-2">Upload a CSV or XLSX file up to 10 MB.</p>
                          <p className="text-sm text-muted-foreground">Please include headers in the first row.</p>
                        </div>
                        
                        <Textarea
                          placeholder="Paste your keyword list here."
                          value={inputValues.keywords || ''}
                          onChange={(e) => handleInputChange('keywords', e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                      </>
                    ) : (
              // freestyle: CSV upload + column selector + prompt textarea
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground mb-1">Upload a CSV file up to 10 MB</p>
                  <p className="text-sm text-muted-foreground">First row should contain column headers</p>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.csv';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) processFile(file, 'csv_data');
                      };
                      input.click();
                    }}>Choose File</Button>
                    </div>
                </div>

                {testMode && inputValues.csv_data && (
                  <div className="text-sm text-muted-foreground bg-secondary/40 border border-border rounded p-3">
                    <div className="font-medium text-foreground mb-1">Mock CSV Preview</div>
                    <pre className="overflow-auto whitespace-pre-wrap">{inputValues.csv_data}</pre>
                  </div>
                )}

                {csvHeaders.length > 0 && (
                        <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Columns to include</label>
                    <div className="flex flex-wrap gap-2">
                      {csvHeaders.map((h) => {
                        const checked = selectedCsvColumns.includes(h);
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              setSelectedCsvColumns((prev) => checked ? prev.filter(x => x !== h) : [...prev, h]);
                            }}
                            className={`px-3 py-1.5 text-xs rounded-full border ${checked ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border'}`}
                          >
                            {h}
                          </button>
                        );
                      })}
                        </div>
                      </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Task (Prompt)</label>
                  <Textarea
                    placeholder="Describe the task for each row..."
                    value={inputValues.prompt || ''}
                    onChange={(e) => handleInputChange('prompt', e.target.value)}
                    className="min-h-[140px] resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Output schema (JSON instruction)</label>
                  <Textarea
                    placeholder={`## OUTPUT\n{\n  "Umsatz": {"wert": "...", "quelle": "..."},\n  "EBIT": {"wert": "...", "quelle": "..."}\n}\n\n## TASK\nBeschreibe hier deine Aufgabe...`}
                    value={inputValues.output_schema || ''}
                    onChange={(e) => handleInputChange('output_schema', e.target.value)}
                    className="min-h-[140px] resize-none"
                  />
                </div>
                    </div>
                  )}
                </div>

                  {/* Step 2: Input Fields */}
                        <div className="mt-6">
                    <h3 className="font-medium text-foreground mb-2">2. Provide input fields*</h3>
                    
                    <div className="space-y-4">
                      {config.id === 'loop-over-rows' && mode === 'keyword-kombat' && (
                      <div>
                        <label className="text-sm text-foreground mb-2 block">Map keyword variable</label>
                        <Select value={inputValues.keyword_variable || ''} onValueChange={(value) => handleInputChange('keyword_variable', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keyword">keyword</SelectItem>
                          </SelectContent>
                        </Select>
                        </div>) }
                      
                      {config.id === 'loop-over-rows' && mode === 'keyword-kombat' && (
                      <div>
                        <label className="text-sm text-foreground mb-2 block">Enter company URL</label>
                        <Input
                          placeholder="https://www.example.com/"
                          value={inputValues.company_url || ''}
                          onChange={(e) => handleInputChange('company_url', e.target.value)}
                      />
                    </div>) }
                    </div>
                </div>

                  {/* Run Button */}
                  <div className="flex items-center gap-3 pt-4 mt-auto">
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting}
                      className="flex-1 py-6 text-sm font-medium rounded-full bg-foreground hover:bg-foreground/90 text-background"
                    >
                      RUN WORKFLOW
                      <div className="ml-2">→</div>
                </Button>
                  </div>

                {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OUTPUT SECTION */}
          <div className="space-y-6">
            <Card className="border-2 border-border rounded-2xl h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-muted text-muted-foreground rounded-lg px-3 py-1 text-sm font-medium">
                    WORKFLOW OUTPUT
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>⚡</span>
                    <span>Powered By Gemini 2.5 Flash</span>
                    <Info className="h-4 w-4" />
                      </div>
                    </div>

                {isExecuting && (
                  <div className="py-12 space-y-6">
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm mb-4">
                        {loadingPhrase}
                      </p>
                      <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden border border-border">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                          style={{ 
                            width: `${Math.max(5, Math.min(100, loadingProgress))}%`
                          }}
                        >
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                        <span>
                          {Math.max(0, Math.round(loadingProgress))}%
                        </span>
                        <span>
                          Est. {getEstimatedTime().min}-{getEstimatedTime().max}s
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {showResults && (
                  <div className="space-y-4">
                    {renderResults()}
                  </div>
                )}

                {!isExecuting && !showResults && (
                  <div className="space-y-4">
                    {[{n:1,t:'AI Processing',d:'Model prepares context & tools'},{n:2,t:'Loop over rows',d:'Process each row using your prompt'},{n:3,t:'Aggregate output',d:'Download as CSV or JSON'}].map((s) => (
                      <div key={s.n} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold shrink-0">{s.n}</div>
                        <div>
                          <div className="text-foreground font-medium">{s.t}</div>
                          <div className="text-sm text-muted-foreground">{s.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBase; 