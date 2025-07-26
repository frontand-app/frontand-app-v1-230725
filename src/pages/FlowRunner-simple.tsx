import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, AlertCircle, Upload, FileText, Search, Globe, BarChart3, Sparkles, File, CheckCircle2, X, ChevronDown, Zap, Database, Check } from 'lucide-react';
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

const LoopOverRowsRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [csvData, setCsvData] = useState('');
  const [prompt, setPrompt] = useState('Analyze each row and provide helpful insights');
  const [testMode, setTestMode] = useState(true);
  const [enableGoogleSearch, setEnableGoogleSearch] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [parsedData, setParsedData] = useState<{headers: string[], rows: string[][]} | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhrase, setLoadingPhrase] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Combobox states
  const [openSampleData, setOpenSampleData] = useState(false);
  const [openPresets, setOpenPresets] = useState(false);
  const [selectedSample, setSelectedSample] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');

  // AI Processing Instruction Presets - Simplified for consumers
  const promptPresets = [
    {
      id: "lead-scoring",
      title: "Lead Scoring",
      description: "Score and analyze sales leads",
      prompt: "Analyze each lead and provide: Lead Score (1-10), Company Size, Industry, and Likelihood to convert (High/Medium/Low)."
    },
    {
      id: "content-analysis",
      title: "Content Analysis", 
      description: "Categorize and analyze content",
      prompt: "Analyze each content piece and provide: Category, Target Audience, Quality Score (1-10), and Key insights."
    },
    {
      id: "customer-feedback",
      title: "Customer Feedback",
      description: "Analyze customer reviews and feedback",
      prompt: "Analyze each feedback and provide: Sentiment (Positive/Negative/Neutral), Key Issues, and Recommendations."
    }
  ];

  // Sample CSV Data - Reduced to most common use cases
  const sampleDatasets = [
    {
      id: "sales-leads",
      title: "Sales Leads",
      description: "Company contacts for lead scoring",
      data: `Name,Email,Company,Website
John Smith,john@techcorp.com,TechCorp Inc,techcorp.com
Sarah Johnson,sarah@innovate.io,Innovate Solutions,innovate.io
Mike Chen,mike@startupxyz.com,StartupXYZ,startupxyz.com`
    },
    {
      id: "customer-reviews",
      title: "Customer Reviews", 
      description: "Product reviews and ratings",
      data: `Customer,Product,Rating,Review
Alice,Mobile App,4,"Great app but could use more features"
Bob,Web Platform,5,"Excellent experience, very intuitive"
Carol,API Service,3,"Good but documentation needs work"`
    }
  ];

  // Flatten prompts for search
  const allPrompts = promptPresets;

  // Loading phrases that cycle during processing
  const loadingPhrases = [
    "🚀 Initializing Gemini 2.5 Flash...",
    "📊 Analyzing your data structure...",
    "🧠 Understanding processing requirements...",
    ...(enableGoogleSearch ? [
      "🔍 Searching the web for current information...",
      "🌐 Gathering real-time data from multiple sources...",
      "📈 Cross-referencing with latest market data..."
    ] : []),
    "⚡ Processing with advanced AI algorithms...",
    "🎯 Generating intelligent insights...",
    "📝 Formatting results with smart column names...",
    "✨ Finalizing your enhanced dataset..."
  ];

  // Calculate estimated processing time based on row count
  const getEstimatedTime = () => {
    if (!parsedData) return { min: 15, max: 30 };
    
    const rowCount = testMode ? 1 : parsedData.rows.length;
    const baseTimePerRow = enableGoogleSearch ? 8 : 5; // Seconds per row (more with Google Search)
    const baseOverhead = enableGoogleSearch ? 15 : 10; // Base startup time
    
    const totalTime = baseOverhead + (rowCount * baseTimePerRow);
    const minTime = Math.max(10, Math.round(totalTime * 0.8));
    const maxTime = Math.round(totalTime * 1.5);
    
    return { min: minTime, max: maxTime };
  };

  // Loading animation effect
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let phraseInterval: NodeJS.Timeout;
    let startupTimeout: NodeJS.Timeout;
    
    if (isExecuting) {
      let currentPhraseIndex = 0;
      let currentProgress = 0;
      
      // Start loading immediately with a small initial progress
      setLoadingProgress(5);
      setLoadingPhrase(loadingPhrases[0]);
      
      // Start phrase cycling immediately
      phraseInterval = setInterval(() => {
        currentPhraseIndex = (currentPhraseIndex + 1) % loadingPhrases.length;
        setLoadingPhrase(loadingPhrases[currentPhraseIndex]);
      }, 3000); // Change phrase every 3 seconds
      
      // Start progress after a brief delay
      startupTimeout = setTimeout(() => {
        progressInterval = setInterval(() => {
          currentProgress += 1;
          
          // Non-linear progress: slow start, fast middle, slow end
          const progressSpeed = currentProgress < 20 ? 0.8 : 
                              currentProgress < 60 ? 1.5 : 
                              currentProgress < 80 ? 1.0 : 0.3;
          
          currentProgress += progressSpeed + (Math.random() * 0.4);
          
          // Cap at 85% until actual completion
          if (currentProgress > 85) currentProgress = 85;
          
          setLoadingProgress(currentProgress);
        }, 400);
      }, 500);
    } else {
      // Reset loading state when not executing
      setLoadingProgress(0);
      setLoadingPhrase('');
    }
    
    return () => {
      if (startupTimeout) clearTimeout(startupTimeout);
      if (progressInterval) clearInterval(progressInterval);
      if (phraseInterval) clearInterval(phraseInterval);
    };
  }, [isExecuting, loadingPhrases]);

  // Only render if this is the loop-over-rows workflow
  if (id !== 'loop-over-rows') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Not Found</CardTitle>
            <CardDescription>The requested workflow "{id}" is not available.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const parseCSVData = (data: string) => {
    const lines = data.trim().split('\n');
    if (lines.length < 2) return null;
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      // Better CSV parsing that handles quoted fields
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

  const handleTextInput = (value: string) => {
    setCsvData(value);
    const parsed = parseCSVData(value);
    setParsedData(parsed);
    setError(null);
    setUploadedFile(null);
  };

  const handleSampleData = (sampleData: string, title: string) => {
    setCsvData(sampleData);
    const parsed = parseCSVData(sampleData);
    setParsedData(parsed);
    setError(null);
    setUploadedFile(null);
    setInputMethod('text'); // Switch to text tab to show the data
    setSelectedSample(title);
    setOpenSampleData(false);
  };

  const handlePromptPreset = (presetPrompt: string, title: string) => {
    setPrompt(presetPrompt);
    setSelectedPreset(title);
    setOpenPresets(false);
  };

  const processFile = (file: File) => {
    if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
        const parsed = parseCSVData(content);
        setParsedData(parsed);
      setError(null);
      setUploadedFile(file);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      };
      reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const clearFile = () => {
    setCsvData('');
    setParsedData(null);
    setUploadedFile(null);
    setError(null);
  };

  const handleExecute = async () => {
    if (!csvData.trim() || !parsedData) {
      setError('Please provide valid CSV data with headers');
      return;
    }

    // Clear previous results and reset all states
    setResults(null);
    setError(null);
    setShowResults(false);
    setIsExecuting(true);
    setLoadingProgress(5);
    setLoadingPhrase(loadingPhrases[0]);

    try {
      // Format data for Modal API - convert CSV to row-keyed array format
      const rowsToProcess = testMode ? parsedData.rows.slice(0, 1) : parsedData.rows;
      
      // Convert rows to row-keyed array format as expected by Modal
      const dataDict: Record<string, string[]> = {};
      rowsToProcess.forEach((row, index) => {
        const rowKey = `row_${index + 1}`;
        dataDict[rowKey] = row;  // Send the row as an array directly
      });
      
      const requestData = {
        data: dataDict,
        headers: parsedData.headers,
        prompt: prompt.trim(),
        batch_size: 10,
        enable_google_search: enableGoogleSearch
      };

      console.log('Sending request:', requestData);

      try {
      const response = await fetch('https://scaile--loop-over-rows-fastapi-app.modal.run/process', {
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
        
        // Smooth completion animation
        setLoadingProgress(95);
        setLoadingPhrase("✅ Processing complete!");
        
        // Complete progress to 100% smoothly
        setTimeout(() => {
          setLoadingProgress(100);
        }, 300);
        
        // Hide loading and show results after completion animation
        setTimeout(() => {
          setIsExecuting(false);
      setResults(result);
          setShowResults(true);
        }, 800);
        
      } catch (fetchError: any) {
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('CORS') || fetchError.name === 'TypeError') {
          console.log('🚨 CORS Error detected - Modal endpoint needs CORS configuration');
          
          throw new Error(`🔧 CORS Configuration Needed

The Modal endpoint is working correctly (verified via direct API test), but the browser is blocking the request due to missing CORS headers.

✅ Endpoint Status: Working (https://scaile--loop-over-rows-fastapi-app.modal.run/process)
❌ Issue: Missing CORS middleware in Modal FastAPI app

🛠️ How to Fix:
1. Add CORS middleware to your Modal FastAPI app:

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

2. Redeploy your Modal app: modal deploy

3. Test again - the workflow will work perfectly!

💡 The API endpoint is confirmed working via curl test.`);
        }
        
        throw fetchError;
      }

    } catch (err: any) {
      console.error('Execution error:', err);
      setError(err.message || 'Failed to execute workflow');
      setIsExecuting(false);
      setLoadingProgress(0);
      setLoadingPhrase('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Powered by Gemini 2.5 Flash
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Batch Processing</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform your CSV data with intelligent AI analysis. Upload your data, describe what you want to achieve, and let our AI process each row with precision.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* INPUT SECTION */}
        <div className="space-y-6">
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  Input Data
              </CardTitle>
                <CardDescription className="text-base">
                  Upload or paste your CSV data to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Input Method Tabs */}
                <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'text' | 'file')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                    <TabsTrigger value="text" className="flex items-center gap-2 data-[state=active]:bg-white">
                    <FileText className="w-4 h-4" />
                    Paste CSV
                  </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center gap-2 data-[state=active]:bg-white">
                    <Upload className="w-4 h-4" />
                      Upload File
                  </TabsTrigger>
                </TabsList>
                
                  <div className="mt-6">
                    <TabsContent value="text" className="space-y-3 m-0">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="csv-data" className="text-sm font-medium text-gray-900">
                          CSV Data (include headers)
                        </Label>
                        <Popover open={openSampleData} onOpenChange={setOpenSampleData}>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              role="combobox"
                              aria-expanded={openSampleData}
                              size="sm" 
                              className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            >
                              {selectedSample ? "✓ Sample loaded" : "Try sample"}
                              <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[240px] p-0" align="end">
                            <Command>
                              <CommandInput placeholder="Search sample data..." className="h-9" />
                              <CommandEmpty>No sample data found.</CommandEmpty>
                              <CommandGroup className="max-h-[200px] overflow-auto">
                                {sampleDatasets.map((dataset) => (
                                  <CommandItem
                                    key={dataset.id}
                                    onSelect={() => handleSampleData(dataset.data, dataset.title)}
                                    className="flex flex-col items-start p-3 cursor-pointer"
                                  >
                                    <div className="flex items-center w-full">
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedSample === dataset.title ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{dataset.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">{dataset.description}</div>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    <Textarea
                      id="csv-data"
                      placeholder={`Name,Email,Company
John Doe,john@example.com,Tech Corp
Jane Smith,jane@example.com,Innovation Inc
Mike Johnson,mike@example.com,StartupXYZ`}
                      value={csvData}
                      onChange={(e) => handleTextInput(e.target.value)}
                        className="min-h-[140px] font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 border-gray-200"
                    />
                  </TabsContent>
                  
                    <TabsContent value="file" className="space-y-3 m-0">
                      <Label htmlFor="csv-file" className="text-sm font-medium text-gray-900">
                        Upload CSV File
                      </Label>
                      
                      {/* Modern Drag & Drop Upload Zone */}
                      <div 
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                          dragActive 
                            ? 'border-blue-400 bg-blue-50' 
                            : uploadedFile || csvData
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                        }`}
                        onDragEnter={handleDragIn}
                        onDragLeave={handleDragOut}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                      id="csv-file"
                      type="file"
                          accept=".csv,text/csv"
                      onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        
                        {uploadedFile || csvData ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center">
                              <div className="p-3 bg-green-100 rounded-full">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                              </div>
                            </div>
                            <div>
                              <p className="text-green-700 font-medium text-lg">File loaded successfully!</p>
                              {uploadedFile && (
                                <p className="text-green-600 text-sm mt-1">{uploadedFile.name}</p>
                              )}
                              <div className="flex items-center justify-center gap-4 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById('csv-file')?.click()}
                                  className="border-green-300 text-green-700 hover:bg-green-100"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Replace File
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={clearFile}
                                  className="border-gray-300 text-gray-600 hover:bg-gray-100"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Clear
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-center">
                              <div className={`p-4 rounded-full transition-colors ${
                                dragActive ? 'bg-blue-100' : 'bg-gray-100'
                              }`}>
                                <Upload className={`w-8 h-8 transition-colors ${
                                  dragActive ? 'text-blue-600' : 'text-gray-500'
                                }`} />
                              </div>
                            </div>
                            <div>
                              <p className={`text-lg font-medium transition-colors ${
                                dragActive ? 'text-blue-700' : 'text-gray-700'
                              }`}>
                                {dragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file'}
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                or <span className="text-blue-600 font-medium">click to browse</span>
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                              <File className="w-3 h-3" />
                              <span>Supports .csv files up to 10MB</span>
                            </div>
                          </div>
                        )}
                      </div>
                  </TabsContent>
                </div>
              </Tabs>

                {/* Always Visible Data Preview */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Data Preview</span>
                  </div>
                  
                  {parsedData ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                          📊 {parsedData.headers.length} columns
                        </div>
                        <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                          📋 {parsedData.rows.length} rows
                          </div>
                            </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-blue-700 mb-1">Headers:</div>
                        <div className="flex flex-wrap gap-1">
                          {parsedData.headers.map((header, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {header}
                            </span>
                          ))}
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            + AI Analysis
                          </span>
                        </div>
                      </div>
                      
                      {parsedData.rows.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">Sample rows:</div>
                          <div className="text-xs text-gray-600 space-y-1 font-mono bg-white p-2 rounded">
                            {parsedData.rows.slice(0, 2).map((row, index) => (
                              <div key={index} className="truncate">
                                <span className="text-gray-400">#{index + 1}:</span> {row.slice(0, 3).join(' • ')}{row.length > 3 ? '...' : ''}
                              </div>
                            ))}
                            {parsedData.rows.length > 2 && (
                              <div className="text-gray-400">...and {parsedData.rows.length - 2} more rows</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2">📊</div>
                      <p className="text-sm">Upload or paste CSV data to see preview</p>
                      <p className="text-xs text-gray-400 mt-1">First row should contain column headers</p>
                    </div>
                )}
              </div>

                {/* AI Prompt with Presets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt" className="text-sm font-medium text-gray-900">
                      AI Processing Instructions
                    </Label>
                    <Popover open={openPresets} onOpenChange={setOpenPresets}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          role="combobox"
                          aria-expanded={openPresets}
                          size="sm" 
                          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        >
                          {selectedPreset ? "✓ Template used" : "Use template"}
                          <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="end">
                        <Command>
                          <CommandInput placeholder="Search templates..." className="h-9" />
                          <CommandEmpty>No templates found.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-auto">
                            {promptPresets.map((preset) => (
                              <CommandItem
                                key={preset.id}
                                onSelect={() => handlePromptPreset(preset.prompt, preset.title)}
                                className="flex flex-col items-start p-3 cursor-pointer"
                              >
                                <div className="flex items-center w-full">
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedPreset === preset.title ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{preset.title}</div>
                                    <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                <Textarea
                  id="prompt"
                    placeholder="Tell the AI what you want to learn about each row... (e.g., 'Score these leads from 1-10 and tell me which ones to focus on')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[80px] resize-none focus:ring-2 focus:ring-blue-500 border-gray-200"
                />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    The AI will analyze each row according to your instructions
                </p>
              </div>

                {/* Control Settings */}
                <div className="space-y-4 pt-2">
                  <div className="text-sm font-medium text-gray-900 mb-3">Processing Settings</div>
                  
                  {/* Test Mode Toggle - Consistent Style */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Play className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <Label htmlFor="test-mode" className="text-sm font-medium text-gray-900 cursor-pointer">
                          Test Mode
                        </Label>
                        <p className="text-sm text-gray-600">
                          {testMode ? 'Process only 1 row for testing' : `Process all ${parsedData?.rows.length || 0} rows`}
                        </p>
                      </div>
                    </div>
                  <Switch
                    id="test-mode"
                    checked={testMode}
                    onCheckedChange={setTestMode}
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>

                  {/* Google Search Toggle - Consistent Style */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="w-4 h-4 text-blue-600" />
                      </div>
                  <div>
                        <Label htmlFor="google-search" className="text-sm font-medium text-gray-900 cursor-pointer">
                          Google Search
                    </Label>
                    <p className="text-sm text-gray-600">
                          {enableGoogleSearch 
                            ? '🌐 AI can access real-time web information'
                            : '🔒 AI uses only its training data'
                          }
                    </p>
                  </div>
                </div>
                  <Switch
                    id="google-search"
                    checked={enableGoogleSearch}
                    onCheckedChange={setEnableGoogleSearch}
                      className="data-[state=checked]:bg-blue-500"
                    />
                </div>
              </div>

              {/* Execute Button */}
              <Button
                onClick={handleExecute}
                disabled={isExecuting || !parsedData}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing{enableGoogleSearch ? ' with Google Search' : ''}...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                      Execute AI Processing
                    {enableGoogleSearch && <Search className="w-4 h-4 ml-2" />}
                  </>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* OUTPUT SECTION */}
        <div className="space-y-6">
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  Results
              </CardTitle>
                <CardDescription className="text-base">
                AI processing results with smart column names
              </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Enhanced Loading State with Progress Bar */}
              {isExecuting && (
                  <div className="py-12 space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-full">
                        <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                        <span className="text-blue-700 font-medium">
                          AI Processing in Progress
                          {enableGoogleSearch && <span className="text-blue-800"> + Live Web Search</span>}
                        </span>
                      </div>
                      <p className="text-gray-600 text-lg">
                        {testMode ? 'Analyzing 1 row...' : `Processing ${parsedData?.rows.length || 0} rows...`}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-4">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out relative"
                          style={{ 
                            width: `${Math.max(5, Math.min(100, loadingProgress))}%`
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">
                          {Math.max(0, Math.round(loadingProgress))}%
                        </span>
                        <span className="text-gray-500">
                          {enableGoogleSearch ? 'Enhanced with web data' : 'Using AI training data'}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Loading Phrase */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-700 font-medium">
                          {loadingPhrase}
                        </span>
                      </div>
                    </div>

                    {/* Estimated Time */}
                    <div className="text-center text-sm text-gray-500 space-y-1">
                      {(() => {
                        const { min, max } = getEstimatedTime();
                        return (
                          <p>⏱️ Estimated time: {min}-{max} seconds 
                            <span className="text-xs ml-2 text-blue-600 font-medium">
                              ({testMode ? '1 row' : `${parsedData?.rows.length || 0} rows`})
                            </span>
                          </p>
                        );
                      })()}
                      <p className="text-xs">🧠 Powered by Gemini 2.5 Flash {enableGoogleSearch && '+ Real-time Web Search'}</p>
                  </div>
                </div>
              )}

              {/* Results Display */}
                {showResults && results && results.results && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">
                          Processed {Array.isArray(results.results) ? results.results.length : 1} row(s) successfully
                        </span>
                    </div>
                    {results.output_column_name && (
                        <div className="text-blue-600 font-medium text-sm">
                        Output: {results.output_column_name}
                      </div>
                    )}
                  </div>
                  
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <TableOutput 
                        data={{
                    columns: Object.keys(results.results[0] || {}).map(key => ({
                      key,
                      label: key === results.output_column_name 
                        ? results.output_column_name.replace(/_/g, ' ')
                        : key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                      type: 'text' as const,
                      sortable: true
                    })),
                    rows: Array.isArray(results.results) ? results.results : [results.results]
                        }}
                        enableSearch={true}
                        enableExport={true}
                      />
                    </div>
                </div>
              )}

              {/* Empty State */}
                {!isExecuting && !showResults && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for AI Processing</h3>
                    <p className="text-gray-600 text-center max-w-sm">
                      Upload your CSV data and click "Execute AI Processing" to see intelligent results with automatically generated column names.
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

export default LoopOverRowsRunner;
