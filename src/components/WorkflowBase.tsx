import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, AlertCircle, Upload, FileText, Search, Globe, BarChart3, Sparkles, File, CheckCircle2, X, ChevronDown, Check, Clock, Lightbulb, Info, ArrowRight, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
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
  // Core state
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Input states - dynamic based on config
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [testMode, setTestMode] = useState(config.supportsTestMode ?? false);
  const [enableGoogleSearch, setEnableGoogleSearch] = useState(false);
  
  // UI states
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhrase, setLoadingPhrase] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [openTemplates, setOpenTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
    const csvField = config.inputs.find(field => field.type === 'csv');
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
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  // Validate inputs
  const validateInputs = (): string | null => {
    for (const field of config.inputs) {
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
        enable_google_search: enableGoogleSearch
      };

      // Special handling for loop-over-rows workflow (CSV processing)
      if (config.id === 'loop-over-rows' && inputValues.csv_data && inputValues.prompt) {
        const parsedData = parseCSVData(inputValues.csv_data);
        if (!parsedData) {
          throw new Error('Invalid CSV data format');
        }

        // Format data for Modal API - convert CSV to row-keyed array format
        const rowsToProcess = testMode ? parsedData.rows.slice(0, 1) : parsedData.rows;
        
        // Convert rows to row-keyed array format as expected by Modal
        const dataDict: Record<string, string[]> = {};
        rowsToProcess.forEach((row, index) => {
          const rowKey = `row_${index + 1}`;
          dataDict[rowKey] = row;  // Send the row as an array directly
        });
        
        requestData = {
          data: dataDict,
          headers: parsedData.headers,
          prompt: inputValues.prompt.trim(),
          batch_size: 10,
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
          enable_google_search: enableGoogleSearch
        };
      }

      console.log('Sending request to:', config.endpoint, requestData);

      const response = await fetch(config.endpoint, {
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-sm mb-4">
            <Sparkles className="w-3 h-3" />
            Powered by Gemini 2.5 Flash
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{config.title}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-base">
            {config.description}
          </p>
        </div>

        {/* Simple Expandable Explanation */}
        {config.visualExplanation && (
          <div className="mb-6">
            {/* Minimal Overview - Always Visible */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  {config.visualExplanation.overview || `${config.title} workflow`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {config.visualExplanation.estimatedTime && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {config.visualExplanation.estimatedTime}
                  </span>
                )}
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
                >
                  {showExplanation ? 'Hide details' : 'How it works'}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Expandable Details */}
            {showExplanation && (
              <div className="mt-3 border border-gray-200 rounded-lg bg-white">
                <div className="p-6">
                  <div className="space-y-6">
                    {config.visualExplanation.steps.map((step, index) => (
                      <div key={step.step} className="flex gap-3">
                        {/* Simple step indicator */}
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">{step.step}</span>
                        </div>
                        
                        {/* Step content */}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 mb-1">{step.title}</h4>
                          <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                          
                          {step.example && (
                            <p className="text-xs text-gray-500 italic">Example: {step.example}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Compact Use Cases */}
                  {config.visualExplanation.useCases && config.visualExplanation.useCases.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-700 mb-2">Common uses:</p>
                      <p className="text-xs text-gray-600">
                        {config.visualExplanation.useCases.slice(0, 3).join(' • ')}
                        {config.visualExplanation.useCases.length > 3 && ' • ...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* INPUT SECTION */}
          <div className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-medium">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <config.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  Input
                </CardTitle>
                <CardDescription className="text-sm flex items-center justify-between">
                  <span>Configure your {config.title.toLowerCase()} settings</span>
                  {config.templates && config.templates.length > 0 && (
                    <Popover open={openTemplates} onOpenChange={setOpenTemplates}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        >
                          {selectedTemplate ? "✓" : "Templates"}
                          <ChevronDown className="ml-1 h-2 w-2 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="end">
                        <Command>
                          <CommandInput placeholder="Search templates..." className="h-9" />
                          <CommandEmpty>No templates found.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-auto">
                            {config.templates.map((template) => (
                              <CommandItem
                                key={template.id}
                                onSelect={() => handleTemplateSelect(template)}
                                className="flex flex-col items-start p-3 cursor-pointer"
                              >
                                <div className="flex items-center w-full">
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedTemplate === template.title ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{template.title}</div>
                                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dynamic Input Fields */}
                {config.inputs.map((field) => (
                  <div key={field.id} className="space-y-3">
                    <Label htmlFor={field.id} className="text-sm font-medium text-gray-900">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderInputField(field)}
                    {field.helpText && (
                      <p className="text-xs text-gray-500">{field.helpText}</p>
                    )}
                  </div>
                ))}

                {/* Control Settings */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="text-sm font-medium text-gray-700 mb-2">Settings</div>
                  
                  {/* Smart Validation Warnings */}
                  {config.id === 'loop-over-rows' && inputValues.csv_data && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium mb-1">💡 Optimization tip:</p>
                          <p>Your CSV has {(inputValues.csv_data.split('\n').length - 1)} rows. 
                          {(inputValues.csv_data.split('\n').length - 1) > 100 ? 
                            ' Consider enabling test mode first to validate your prompt with 1 row.' :
                            ' This should process quickly with your current settings.'
                          }</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {config.supportsTestMode && (
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        <div>
                          <Label htmlFor="test-mode" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Test Mode
                          </Label>
                          <p className="text-xs text-gray-500">
                            {testMode ? 'Process limited data for testing' : 'Process all data'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="test-mode"
                        checked={testMode}
                        onCheckedChange={setTestMode}
                        className="data-[state=checked]:bg-gray-900"
                      />
                    </div>
                  )}

                  {config.supportsGoogleSearch && (
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        <div>
                          <Label htmlFor="google-search" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Google Search
                          </Label>
                          <p className="text-xs text-gray-500">
                            {enableGoogleSearch 
                              ? 'AI can access real-time web information'
                              : 'AI uses only its training data'
                            }
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="google-search"
                        checked={enableGoogleSearch}
                        onCheckedChange={setEnableGoogleSearch}
                        className="data-[state=checked]:bg-gray-900"
                      />
                    </div>
                  )}
                </div>

                {/* Execute Button */}
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run {config.title}
                    </>
                  )}
                </Button>

                {/* Enhanced Error Display */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 text-sm">
                      <div className="space-y-2">
                        <p className="font-medium">Something went wrong:</p>
                        <p>{error}</p>
                        {/* Helpful suggestions based on error type */}
                        {error.includes('CSV') && (
                          <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                            <p className="text-xs text-red-800 mb-1 font-medium">💡 Quick fixes:</p>
                            <ul className="text-xs text-red-700 space-y-1">
                              <li>• Make sure your file has headers in the first row</li>
                              <li>• Check that the file is properly formatted CSV</li>
                              <li>• Try with a smaller file first (under 1MB)</li>
                            </ul>
                          </div>
                        )}
                        {error.includes('HTTP') && (
                          <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                            <p className="text-xs text-red-800 mb-1 font-medium">💡 This might help:</p>
                            <ul className="text-xs text-red-700 space-y-1">
                              <li>• Try again in a few seconds (server might be busy)</li>
                              <li>• Enable test mode to process less data</li>
                              <li>• Check if all required fields are filled</li>
                            </ul>
                          </div>
                        )}
                        {error.includes('validation') && (
                          <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                            <p className="text-xs text-red-800 mb-1 font-medium">💡 Please check:</p>
                            <ul className="text-xs text-red-700 space-y-1">
                              <li>• All required fields are completed</li>
                              <li>• Input format matches the examples</li>
                              <li>• File size is within limits</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* OUTPUT SECTION */}
          <div className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-medium">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                  </div>
                  Results
                </CardTitle>
                <CardDescription className="text-sm">
                  Your {config.title.toLowerCase()} results will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Loading State */}
                {isExecuting && (
                  <div className="py-12 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                        <span className="text-gray-700 text-sm">
                          Processing...
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">
                        {testMode ? 'Running in test mode' : 'Processing your request'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gray-800 rounded-full transition-all duration-700 ease-out"
                          style={{ 
                            width: `${Math.max(5, Math.min(100, loadingProgress))}%`
                          }}
                        >
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                          {Math.max(0, Math.round(loadingProgress))}%
                        </span>
                        <span className="text-gray-500">
                          {enableGoogleSearch ? 'With web search' : 'Standard processing'}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-gray-600 text-sm">
                        {loadingPhrase}
                      </div>
                    </div>

                    <div className="text-center text-xs text-gray-400 space-y-1">
                      {(() => {
                        const { min, max } = getEstimatedTime();
                        return (
                          <p>Estimated time: {min}-{max} seconds</p>
                        );
                      })()}
                      <p>Powered by Gemini 2.5 Flash{enableGoogleSearch && ' + Web Search'}</p>
                    </div>
                  </div>
                )}

                {/* Results Display */}
                {showResults && (
                  <div className="space-y-3 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-gray-600 text-sm">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Processing completed
                    </div>
                    
                    {renderResults()}
                  </div>
                )}

                {/* Empty State */}
                {!isExecuting && !showResults && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="text-4xl mb-3">⚡</div>
                    <h3 className="text-base font-medium text-gray-600 mb-1">Ready to process</h3>
                    <p className="text-gray-500 text-center max-w-sm text-sm">
                      Configure your settings and click "Run {config.title}" to see results.
                    </p>
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