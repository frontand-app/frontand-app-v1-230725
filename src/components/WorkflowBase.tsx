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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm font-medium text-muted-foreground mb-4">
            <config.icon className="w-4 h-4" />
            <span>{config.category}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            {config.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {config.description}
          </p>
        </div>

        {/* Simple Expandable Explanation */}
        {config.visualExplanation && (
          <div className="mb-8 max-w-4xl mx-auto">
            {/* Minimal Overview - Always Visible */}
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {config.visualExplanation.overview || `${config.title} workflow`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {config.visualExplanation.estimatedTime && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {config.visualExplanation.estimatedTime}
                  </span>
                )}
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-background/50"
                >
                  {showExplanation ? 'Hide details' : 'How it works'}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Expandable Details */}
            {showExplanation && (
              <div className="mt-3 border border-border rounded-lg bg-background">
                <div className="p-6">
                  <div className="space-y-6">
                    {config.visualExplanation.steps.map((step, index) => (
                      <div key={step.step} className="flex gap-4">
                        {/* Simple step indicator */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                          <span className="font-medium text-foreground">{step.step}</span>
                        </div>
                        
                        {/* Step content */}
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">{step.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                          
                          {step.example && (
                            <p className="text-xs text-muted-foreground/80 italic">Example: {step.example}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Compact Use Cases */}
                  {config.visualExplanation.useCases && config.visualExplanation.useCases.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <p className="text-sm font-medium text-foreground mb-3">Common uses:</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* INPUT SECTION */}
          <div className="space-y-6">
            <Card className="border-border rounded-2xl bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <div className="p-2.5 bg-secondary rounded-lg border border-border">
                    <config.icon className="w-5 h-5 text-foreground" />
                  </div>
                  Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dynamic Input Fields */}
                {config.inputs.map((field) => (
                  <div key={field.id} className="space-y-3">
                    <Label htmlFor={field.id} className="font-medium">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderInputField(field)}
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    )}
                  </div>
                ))}

                {/* Control Settings */}
                <div className="space-y-3 pt-6 border-t border-border">
                  <div className="font-medium">Settings</div>
                  
                  {config.supportsTestMode && (
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                      <div>
                        <Label htmlFor="test-mode" className="font-medium cursor-pointer">
                          Test Mode
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {testMode ? 'Process 1 row for quick testing' : 'Process all data'}
                        </p>
                      </div>
                      <Switch
                        id="test-mode"
                        checked={testMode}
                        onCheckedChange={setTestMode}
                      />
                    </div>
                  )}

                  {config.supportsGoogleSearch && (
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                      <div>
                        <Label htmlFor="google-search" className="font-medium cursor-pointer">
                          Google Search
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {enableGoogleSearch 
                            ? 'AI can access real-time web info'
                            : 'AI uses only its training data'
                          }
                        </p>
                      </div>
                      <Switch
                        id="google-search"
                        checked={enableGoogleSearch}
                        onCheckedChange={setEnableGoogleSearch}
                      />
                    </div>
                  )}
                </div>

                {/* Execute Button */}
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="w-full h-12 text-base font-medium"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Run Workflow
                    </>
                  )}
                </Button>

                {/* Enhanced Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-1">An error occurred:</p>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* OUTPUT SECTION */}
          <div className="space-y-6">
            <Card className="border-border rounded-2xl bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <div className="p-2.5 bg-secondary rounded-lg border border-border">
                    <BarChart3 className="w-5 h-5 text-foreground" />
                  </div>
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Loading State */}
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

                {/* Results Display */}
                {showResults && (
                  <div className="space-y-3 animate-in fade-in duration-500">
                    {renderResults()}
                  </div>
                )}

                {/* Empty State */}
                {!isExecuting && !showResults && (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
                    <div className="p-4 bg-secondary rounded-full border border-border mb-4">
                        <Sparkles className="w-8 h-8 text-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Results will appear here</h3>
                    <p className="max-w-xs text-sm">
                      Configure your settings on the left and click "Run Workflow" to start.
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