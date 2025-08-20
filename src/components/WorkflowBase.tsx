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
import CsvPlaintextInput from '@/components/shared/CsvPlaintextInput';
import MockPreview from '@/components/shared/MockPreview';
import GoogleSearchToggle from '@/components/shared/GoogleSearchToggle';
import ColumnSelectorChips from '@/components/shared/ColumnSelectorChips';
import { useAuth } from '@/hooks/useAuth';
import { createExecution, updateExecution, buildFilesForResults } from '@/lib/executionApi';
import { buildLoopOverRowsPayload, buildCrawlPayload, CrawlTask } from '@/lib/modes';
import * as LucideIcons from 'lucide-react';
import { TableOutput, TableData } from '@/components/TableOutput';
import { normalizeResult } from '@/lib/normalizers';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useLocation } from 'react-router-dom';

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
  const location = useLocation();
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
  const highlightOutput = isExecuting || showResults;
  const [inputActive, setInputActive] = useState<boolean>(true);
  const { user } = useAuth();
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const authRequired = !testMode && !user; // sign-in gating (no inline error)
  const inputBadgeClass = highlightOutput ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground';
  const outputBadgeClass = highlightOutput ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground';
  // VC Analyst configurable fund rules (generic defaults, user-editable)
  const [vcStages, setVcStages] = useState<string>('Pre-seed, Seed, Series A');
  const [vcVintageMonths, setVcVintageMonths] = useState<string>('24');
  const [vcTrlMin, setVcTrlMin] = useState<string>('5');
  const [vcSectors, setVcSectors] = useState<string>('Sector A, Sector B');
  const [vcGeos, setVcGeos] = useState<string>('North America, Europe');
  const [vcFundName, setVcFundName] = useState<string>('Your Fund');

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
        output_schema: ''
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
    } else if (isMockMode && (config.id === 'loop-over-rows' && mode === 'vc-analyst')) {
      const mockCsv = 'Companies,Stage,HQ,TRL,Traction,IP,Founder\nSolarForge,Seed,Germany,5,Paying pilot with utility,Filed,Repeat founder\nGridAI,Pre-seed,USA,6,LOIs with energy clients,Granted,PhD technical';
      setInputValues({
        csv_data: mockCsv,
        prompt: buildVcAnalystPrompt(),
        output_schema: ''
      });
      try {
        const parsed = parseCSVData(mockCsv);
        if (parsed) {
          setCsvHeaders(parsed.headers);
          setSelectedCsvColumns(parsed.headers);
        }
      } catch {}
      setUploadedFile({ name: 'vc_analyst_sample.csv' } as File);
      setStep(2);
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

  // Build VC Analyst prompt from variables
  const buildVcAnalystPrompt = (): string => {
    const stages = vcStages;
    const vintage = vcVintageMonths;
    const trl = vcTrlMin;
    const sectors = vcSectors;
    const geos = vcGeos;
    const fund = vcFundName;
    return `You are an intelligent assistant for venture-capital and strategic-investment workflows at ${fund}.

Responsibilities:
1. Convert free-form theses into structured YAML profiles.
2. Interpret startup profiles, compute objective & relevance scores.
3. Classify startups on strategic fit.
4. Produce memos / markdown summaries aligned to fund strategy.
Respond only with structured outputs unless asked otherwise.

# UNIVERSAL INVESTMENT INTELLIGENCE SYSTEM (UIIS)

TASK

1 — Fit Check\nEvaluate the startup in INPUT against the five rules below. Record any rule that fails inside an array called exclusion_reasons.

Rules: [
  { id: "F1", filter: "Stage", pass: "${stages}" },
  { id: "F2", filter: "Launch vintage", pass: "Founded ≤ ${vintage} months ago" },
  { id: "F3", filter: "TRL", pass: "≥ ${trl}" },
  { id: "F4", filter: "Sector", pass: "${sectors}" },
  { id: "F5", filter: "Geography (HQ)", pass: "${geos}" }
]
If exclusion_reasons is not empty → classify the deal as Out of Scope and skip Step 2.

2 — Scoring & Classification (only when exclusion_reasons is empty)
Objective score (0-8) with caps: revenue_or_paying_pilot(3), strategic_partner(3 cap with revenue), industrial_vc(1), subsector_match(1), geography_match(1), ip(1), stage_match(1), impact_aligned(1).

Relevance score (0-100%):
relevance = 0.35*subsector_match + 0.20*stage_match + 0.15*geography_match + 0.10*ip_presence + 0.10*impact_alignment + 0.10*founder_match.

Classification:
High Priority: objective_score ≥ 6 and relevance_score ≥ 75.
Medium Fit: objective_score ≥ 4 and relevance_score ≥ 50.
Not Relevant: below Medium.
Out of Scope: exclusion_reasons non-empty.

3 — Plain-text Summary (no markdown). Format:
Startup: <name>\nStage: <stage>\nSector: <sector → subsector → use_case>\nGeography: <hq_country>\nType: <labels>\nTraction: <list>\nIP: <status>\nFounder Profile: <signals>\nImpact-Aligned: <yes/no>\nObjective Score: <x>/8\nRelevance Score: <y>%\nClassification: <High Priority | Medium Fit | Not Relevant | Out of Scope>\nStrategic Fit: <1–2 sentence rationale>

OUTPUT (JSON only; array with single element):
[
  {
    "Companies": "{{ $json.Companies }}",
    "startup_name": "{{ $json.Companies }}",
    "stage": "<Pre-seed | Seed | Series A | Later>",
    "sector_path": "<main → sub → use_case>",
    "objective_score": 0,
    "relevance_score": 0,
    "classification": "High Priority | Medium Fit | Not Relevant | Out of Scope",
    "summary_txt": "<plain text summary>",
    "exclusion_reasons": []
  }
]
`;
  };

  // Keep VC Analyst prompt in sync with variables
  useEffect(() => {
    if (config.id === 'loop-over-rows' && mode === 'vc-analyst') {
      if (!inputValues.prompt || inputValues.prompt.includes('UNIVERSAL INVESTMENT INTELLIGENCE SYSTEM')) {
        handleInputChange('prompt', buildVcAnalystPrompt());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, vcStages, vcVintageMonths, vcTrlMin, vcSectors, vcGeos, vcFundName]);

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
      const total = Math.max(0, lines.length - 1);
      return testMode ? Math.min(2, total) : total; // In mock, process up to 2 rows
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

      // Use shared mode adapter for loop-over-rows
      if (config.id === 'loop-over-rows') {
        if (mode === 'freestyle' || mode === 'vc-analyst') {
        const parsedData = parseCSVData(inputValues.csv_data);
          if (!parsedData) throw new Error('Invalid CSV data format');
          requestData = buildLoopOverRowsPayload(mode as any, inputValues, {
            testMode,
            enableGoogleSearch,
            webhookUrl: inputValues.webhook_url,
            batchSize: 10,
            selectedColumns: selectedCsvColumns,
            parsedCsv: parsedData,
          });
        } else if (mode === 'keyword-kombat') {
          requestData = buildLoopOverRowsPayload('keyword-kombat', inputValues, {
            testMode,
            enableGoogleSearch,
            webhookUrl: inputValues.webhook_url,
          });
        }
      } else if (['crawl4imprint', 'crawl4contacts', 'crawl4logo', 'crawl4gmaps'].includes(config.id)) {
        // Use shared crawl adapter for all crawling workflows
        const taskMap: Record<string, CrawlTask> = {
          'crawl4imprint': 'imprint',
          'crawl4contacts': 'contacts',
          'crawl4logo': 'logo',
          'crawl4gmaps': 'gmaps'
        };
        
        const task = taskMap[config.id];
        if (!task) {
          throw new Error(`Unknown crawl task for workflow: ${config.id}`);
        }

        requestData = buildCrawlPayload(task, inputValues, {
          testMode,
          enableGoogleSearch,
          webhookUrl: inputValues.webhook_url,
        });
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

      // Create execution record (for dashboard) when starting
      const exec = await createExecution({
        workflowId: config.id,
        inputData: requestData,
        testMode: testMode,
        userId: user?.id
      });
      setCurrentExecutionId(exec.id);

      // Endpoint: allow per-mode override while we unify backend
      // Single unified endpoint handles all modes
      const endpointToUse = config.endpoint;
      // Long-running fetch with AbortController safety but generous timeout (22h)
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 22 * 60 * 60 * 1000);
      const response = await fetch(endpointToUse, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

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

      if (currentExecutionId) {
        // Build downloadable files (CSV/JSON) for the dashboard
        const files = buildFilesForResults(config.id, result);
        await updateExecution(currentExecutionId, {
          status: 'completed',
          results: result,
          files,
          progress: 100,
          completedAt: new Date().toISOString()
        });
      }
      
    } catch (err: any) {
      console.error('Execution error:', err);
      setError(err.message || 'Failed to execute workflow');
      setIsExecuting(false);
      setLoadingProgress(0);
      setLoadingPhrase('');
      if (currentExecutionId) {
        await updateExecution(currentExecutionId, { status: 'failed', errorMessage: err?.message || 'Error' });
      }
    }
  };

  // Determine inputs based on mode for loop-over-rows
  const getActiveInputs = (): WorkflowField[] => {
    if (config.id !== 'loop-over-rows') return config.inputs;
    if (mode === 'freestyle' || mode === 'vc-analyst') return config.inputs;
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
          <CsvPlaintextInput
              id={field.id}
              value={value}
            placeholder={field.placeholder}
            uploadedFileName={uploadedFile?.name || null}
            onChange={(text) => {
              handleInputChange(field.id, text);
              setUploadedFile(null);
            }}
            onFilePicked={(file) => processFile(file, field.id)}
            onClearFile={() => {
                      setUploadedFile(null);
                      handleInputChange(field.id, '');
                    }}
          />
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

        // Normalize to columns/rows using shared normalizer
        const normalized = normalizeResult(config.id, results);
        const tableOutputData = {
          columns: normalized.columns.map((key) => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            type: 'text' as const,
            sortable: true,
          })),
          rows: normalized.rows,
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

              {config.supportsTestMode && (
                <div className="inline-flex items-center gap-2 ml-4">
                  <Switch 
                    checked={testMode} 
                    onCheckedChange={handleMockModeToggle}
                    className="data-[state=checked]:bg-foreground"
                  />
                  <span className="text-sm font-medium text-foreground">Mock mode</span>
                  <Popover>
                      <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Mock mode info"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      </PopoverTrigger>
                    <PopoverContent side="bottom" align="start" className="max-w-sm text-sm">
                      <div className="space-y-2">
                        <div className="font-medium">What is Mock mode?</div>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          <li>Processes a tiny sample (up to 2 rows) so you can preview quickly.</li>
                          <li>Does not use credits and may return simulated results.</li>
                          <li>No webhooks or emails are sent.</li>
                          <li>Switch off to run the full workload.</li>
                        </ul>
                                  </div>
                      </PopoverContent>
                    </Popover>
                </div>
              )}
            </div>
          </div>
        )}
        <p className="text-muted-foreground mb-6">
          {config.id === 'loop-over-rows' && mode === 'keyword-kombat'
            ? 'Score keywords for a specific company; uses the company context to rate each keyword (10–100) with rationale.'
            : config.description}
        </p>

        {/* Mock mode toggle moved next to mode dropdown */}

        {/* (Moved) Google Search toggle appears inside the input card */}

        {/* How it works removed for simpler above-the-fold layout */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto items-stretch content-stretch">
          {/* INPUT SECTION */}
          <div className="space-y-6">
            <Card className={`border-2 ${highlightOutput ? 'border-border' : 'border-primary'} rounded-2xl h-full ${highlightOutput ? 'opacity-80' : 'opacity-100'}`}>
              <CardContent className="p-6 h-full flex flex-col" onMouseDown={() => setInputActive(true)}>
                {authRequired && (
                  <Alert className="mb-4" variant="default">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-medium">Sign in required.</span> You need to sign in to run the full workflow. You can switch on Mock mode to try a short preview.
                      <span className="ml-2 underline"><Link to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`}>Go to sign in</Link></span>
                    </AlertDescription>
                  </Alert>
                )}
                <div className={`${inputBadgeClass} rounded-lg px-3 py-1 text-sm font-medium inline-flex w-fit mb-6`}>
                  YOUR INPUT
                  </div>

                  
                <div className="space-y-6">
                        <div>
                    <h3 className="font-medium text-foreground mb-4">
                      {config.id === 'loop-over-rows' && mode === 'keyword-kombat'
                        ? (step >= 2 ? 'Upload your CSV file with the keywords you would like to rank*' : 'Upload a file or paste a list with the keywords you would like to rank*')
                        : (mode === 'vc-analyst' ? 'Upload your CSV with startup rows (include headers)' : 'Upload CSV data')}
                    </h3>
                    
                      {config.id === 'loop-over-rows' && mode === 'keyword-kombat' ? (
                      <div className="space-y-4">
                        <CsvPlaintextInput
                          id="keywords"
                          value={inputValues.keywords || ''}
                          placeholder="Paste your keyword list here."
                          uploadedFileName={uploadedFile?.name || null}
                          onChange={(text) => handleInputChange('keywords', text)}
                          onFilePicked={(file) => {
                            setStep(2);
                            processFile(file, 'keywords');
                          }}
                          onClearFile={() => {
                            setUploadedFile(null);
                            handleInputChange('keywords', '');
                          }}
                            forceSingleHeader="keyword"
                        />
                        </div>
                    ) : (
                      <div className="space-y-4">
                        <CsvPlaintextInput
                          id="csv_data"
                          value={inputValues.csv_data || ''}
                          placeholder="Paste CSV with headers in first row..."
                          uploadedFileName={uploadedFile?.name || null}
                          onChange={(text) => handleInputChange('csv_data', text)}
                          onFilePicked={(file) => processFile(file, 'csv_data')}
                          onClearFile={() => {
                            setUploadedFile(null);
                            handleInputChange('csv_data', '');
                          }}
                        />

                        {/* Inline preview/edit is handled inside CsvPlaintextInput; no separate preview here */}

                        {csvHeaders.length > 0 && (
                          <ColumnSelectorChips
                            headers={csvHeaders}
                            selected={selectedCsvColumns}
                            onToggle={(_, next) => setSelectedCsvColumns(next)}
                          />
                        )}

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Task (Prompt)</label>
                          <Textarea
                            placeholder={mode === 'vc-analyst' ? 'VC Analyst prompt will be generated from the fund rules below...' : 'Describe the task for each row...'}
                            value={inputValues.prompt || ''}
                            onChange={(e) => handleInputChange('prompt', e.target.value)}
                            className="min-h-[140px] resize-none"
                          />
                      </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Output schema (JSON instruction)</label>
                          <Textarea
                            placeholder={`{\n  "column_name": "value to extract",\n  "another_field": "..."\n}\n\nTip: You can leave this empty. We'll infer JSON by analyzing the first row.`}
                            value={inputValues.output_schema || ''}
                            onChange={(e) => handleInputChange('output_schema', e.target.value)}
                            className="min-h-[140px] resize-none"
                          />
                        </div>
                    </div>
                  )}
                </div>

                   {/* Additional inputs for specific modes */}
                        <div className="mt-6 pt-4 border-t border-border">
                    <div className="space-y-4">
                      {config.id === 'loop-over-rows' && mode === 'keyword-kombat' && uploadedFile && (
                        <div>
                        <label className="text-sm text-foreground mb-2 block">Map keyword variable</label>
                        <Select value={inputValues.keyword_variable || ''} onValueChange={(value) => handleInputChange('keyword_variable', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* In keyword-kombat, the variable should be 'keyword' */}
                            {['keyword'].map((h) => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
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

                    {config.id === 'loop-over-rows' && mode === 'vc-analyst' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm text-foreground mb-1 block">Fund name</label>
                            <Input value={vcFundName} onChange={(e) => setVcFundName(e.target.value)} />
                        </div>
                          <div>
                            <label className="text-sm text-foreground mb-1 block">Stage allowlist</label>
                            <Input value={vcStages} onChange={(e) => setVcStages(e.target.value)} placeholder="Pre-seed, Seed, Series A" />
                      </div>
                          <div>
                            <label className="text-sm text-foreground mb-1 block">Launch vintage ≤ (months)</label>
                            <Input value={vcVintageMonths} onChange={(e) => setVcVintageMonths(e.target.value)} />
                          </div>
                          <div>
                            <label className="text-sm text-foreground mb-1 block">Min TRL</label>
                            <Input value={vcTrlMin} onChange={(e) => setVcTrlMin(e.target.value)} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm text-foreground mb-1 block">Sectors</label>
                            <Input value={vcSectors} onChange={(e) => setVcSectors(e.target.value)} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm text-foreground mb-1 block">Geographies (HQ)</label>
                            <Input value={vcGeos} onChange={(e) => setVcGeos(e.target.value)} />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">The prompt above updates automatically from these fund rules.</div>
                      </div>
                    )}
                    </div>
                </div>

                  {/* Google Search Toggle as last input */}
                  {config.id === 'loop-over-rows' && (
                    <div className="mt-4">
                      <GoogleSearchToggle
                        checked={enableGoogleSearch}
                        onChange={setEnableGoogleSearch}
                        isKeywordMode={mode === 'keyword-kombat'}
                      />
                    </div>
                  )}

                  {/* Run Button */}
                  <div className="flex items-center gap-3 pt-4 mt-auto">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1">
                <Button
                  onClick={handleExecute}
                              disabled={isExecuting || authRequired}
                              className="w-full py-6 text-sm font-medium rounded-full bg-foreground hover:bg-foreground/90 text-background disabled:opacity-60"
                            >
                              RUN WORKFLOW
                              <div className="ml-2">→</div>
                </Button>
                          </div>
                        </TooltipTrigger>
                        {authRequired && (
                          <TooltipContent>
                            Sign in required for full run
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                {/* remove inline auth error; keep space for other errors */}
                {error && !authRequired && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OUTPUT SECTION */}
          <div className="space-y-6">
            <Card className={`border-2 ${highlightOutput ? 'border-primary' : 'border-border'} rounded-2xl h-full`}>
              <CardContent className="p-6 h-full flex flex-col" onMouseDown={() => setInputActive(false)}>
                <div className="flex items-center justify-between mb-6">
                  <div className={`${outputBadgeClass} rounded-lg px-3 py-1 text-sm font-medium`}>
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
                      {(() => {
                            const est = getEstimatedTime();
                            const avg = Math.round((est.min + est.max) / 2);
                            return avg <= 60
                              ? `Hold on ~${avg}s`
                              : `This may take ~${Math.round(avg / 60)} min. We'll email you when it's done.`;
                      })()}
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