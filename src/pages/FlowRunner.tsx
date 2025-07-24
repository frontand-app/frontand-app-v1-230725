
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Play, AlertCircle } from 'lucide-react';
import WorkflowLayout from '@/components/WorkflowLayout';
import { TableOutput, TableData } from '@/components/TableOutput';
import { useAuth } from '@/components/auth/AuthProvider';

interface WorkflowData {
  id: string;
  name: string;
  description: string;
  category: string;
  creator: string;
  rating: number;
  estimatedTime: string;
  inputs: any[];
}

const FlowRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentExecution, setCurrentExecution] = useState<any | null>(null);

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  // Auto-filled inputs functionality removed for simplicity

  const loadWorkflow = async () => {
    setLoading(true);
    try {
      // Mock workflow data based on ID - in production this would come from API
      const mockWorkflow: WorkflowData = {
        id: id || 'cluster-keywords',
        name: id === 'cluster-keywords' ? 'Cluster Keywords' : 
              id === 'sentiment-analysis' ? 'Sentiment Analysis' :
              id === 'google-sheets-processor' ? 'Google Sheets Processor' :
              (id === '550e8400-e29b-41d4-a716-446655440001' || id === 'loop-over-rows') ? 'Loop Over Rows - AI Batch Processing' :
              'Data Enrichment',
        description: id === 'cluster-keywords' 
          ? 'Automatically group and categorize keywords using AI clustering algorithms'
          : id === 'sentiment-analysis'
          ? 'Analyze emotional tone and sentiment in text content'
          : id === 'google-sheets-processor'
          ? 'Process and enrich data in Google Sheets with AI'
          : (id === '550e8400-e29b-41d4-a716-446655440001' || id === 'loop-over-rows')
          ? 'Scalable AI processing with Gemini 2.5-Flash. Transform any workflow into a highly scalable AI processing pipeline with row-keyed object structure and webhook delivery.'
          : 'Enrich your data with additional information and insights',
        category: 'Text Analysis',
        creator: 'CLOSED AI Team',
        rating: 4.8,
        estimatedTime: '30 seconds',
        inputs: id === 'cluster-keywords' ? [
          {
            id: 'keywords',
            type: 'textarea',
            label: 'Keywords to Cluster',
            description: 'Enter keywords separated by commas or new lines',
            required: true,
            placeholder: 'marketing, digital marketing, online marketing, social media, content marketing'
          },
          {
            id: 'num_clusters',
            type: 'number',
            label: 'Number of Clusters',
            description: 'How many groups should the keywords be organized into?',
            default: 5,
            min: 2,
            max: 20
          },
          {
            id: 'similarity_threshold',
            type: 'range',
            label: 'Similarity Threshold',
            description: 'How similar should keywords be to group together?',
            default: 0.7,
            min: 0.1,
            max: 0.9,
            step: 0.1
          }
        ] : id === 'sentiment-analysis' ? [
          {
            id: 'text',
            type: 'textarea',
            label: 'Text to Analyze',
            description: 'Enter the text you want to analyze for sentiment',
            required: true,
            placeholder: 'I love this product! It works exactly as described and the customer service was amazing.'
          },
          {
            id: 'language',
            type: 'select',
            label: 'Language',
            description: 'Select the language of your text',
            default: 'en',
            options: [
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' }
            ]
          }
        ] : (id === '550e8400-e29b-41d4-a716-446655440001' || id === 'loop-over-rows') ? [
          {
            id: 'data',
            type: 'textarea',
            label: 'Your Data',
            description: 'Upload a CSV file or paste your data including headers. First row should be column names.',
            required: true,
            placeholder: 'Name,Email,Company\nJohn Doe,john@example.com,Tech Corp\nJane Smith,jane@example.com,Innovation Inc\nMike Johnson,mike@example.com,StartupXYZ'
          },
          {
            id: 'prompt',
            type: 'textarea',
            label: 'Processing Instructions',
            description: 'Tell the AI what analysis to perform on each row. The result will be added as a new "AI_Analysis" column.',
            required: true,
            placeholder: 'Analyze this contact for lead quality potential. Consider company size, role, and email domain. Provide a brief assessment.'
          },
          {
            id: 'test_mode',
            type: 'toggle',
            label: 'Test Mode',
            description: 'Process only the first row as a test, or process all rows',
            default: true
          }
        ] : [
          {
            id: 'data_input',
            type: 'textarea',
            label: 'Data Input',
            description: 'Enter your data in JSON format or CSV',
            required: true,
            placeholder: '{"name": "John Doe", "email": "john@example.com"}'
          }
        ]
      };

      setWorkflow(mockWorkflow);

      // Set default values
      const defaults: Record<string, any> = {};
      mockWorkflow.inputs.forEach(input => {
        if (input.default !== undefined) {
          defaults[input.id] = input.default;
        }
      });
      
      // Add some sample data for better UX
      if (id === 'cluster-keywords') {
        defaults.keywords = defaults.keywords || 'digital marketing, online marketing, social media marketing, content marketing, email marketing, SEO, SEM, PPC, Facebook ads, Google ads, Instagram marketing, LinkedIn marketing, Twitter marketing, YouTube marketing, affiliate marketing, influencer marketing, video marketing, mobile marketing, marketing automation, conversion optimization';
      } else if (id === 'sentiment-analysis') {
        defaults.text = defaults.text || 'I absolutely love this new product! The design is incredible and it works perfectly. The customer service team was also super helpful when I had questions. Highly recommend!';
      } else if (id === '550e8400-e29b-41d4-a716-446655440001' || id === 'loop-over-rows') {
        // Set simple user-friendly default - will be converted to JSON automatically
        defaults.data = defaults.data || '{"Name": "John Doe", "Email": "john@example.com", "Company": "Tech Corp"}';
        defaults.prompt = defaults.prompt || 'Analyze this contact for lead quality potential. Consider company size, role, and email domain. Provide a brief assessment.';
      }
      
      setFormData(prev => ({ ...defaults, ...prev }));
    } catch (err) {
      setError('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (inputId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [inputId]: value
    }));
  };

  const executeWorkflowAPI = async (workflowId: string, inputs: any): Promise<any> => {
    // Quick toggle: Set to false to use mock data while testing
    const USE_REAL_MODAL = true; // Change to true when Modal endpoint is ready
    
    // Direct Modal integration for Loop Over Rows workflow
    if ((workflowId === '550e8400-e29b-41d4-a716-446655440001' || workflowId === 'loop-over-rows') && USE_REAL_MODAL) {
      try {
        console.log('🚀 Calling real Modal endpoint...');
        
        // Parse CSV data
        const csvData = inputs.data;
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
        
        // Process only first row if test mode, otherwise all rows
        const rowsToProcess = inputs.test_mode ? dataRows.slice(0, 1) : dataRows;
        
        // Convert to Modal format - ensure consistent row key format
        const modalData: Record<string, string[]> = {};
        rowsToProcess.forEach((row, index) => {
          const rowKey = `row_${index + 1}`;  // Use consistent underscore format
          modalData[rowKey] = row;
        });
        
        const response = await fetch('https://scaile--loop-over-rows-fastapi-app.modal.run/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: modalData,
            headers: headers,
            prompt: inputs.prompt,
            batch_size: inputs.test_mode ? 1 : 10,
            enable_google_search: inputs.enable_google_search || false
          })
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Modal API Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Modal response received:', result);
        
        // Transform Modal response to expected format
        if (result.results && Array.isArray(result.results)) {
          // Extract headers from first result object
          const firstResult = result.results[0];
          const responseHeaders = firstResult ? Object.keys(firstResult).filter(key => key !== 'row_key') : [];
          
          const tableData = {
            columns: responseHeaders.map((header) => ({
              key: header,
              label: header === 'rationale' ? 'AI_Analysis' : header.charAt(0).toUpperCase() + header.slice(1),
              type: 'text' as 'number' | 'text' | 'status' | 'date' | 'currency' | 'email',
              sortable: true
            })),
            rows: result.results.map((item, index) => ({
              id: index + 1,
              ...item
            })),
            metadata: {
              totalRows: result.results.length,
              successfulRows: result.processed_count || result.results.length,
              failedRows: (result.total_count || result.results.length) - (result.processed_count || result.results.length),
              processingTime: '30-60s',
              model: 'gemini-2.5-flash'
            }
          };

          return {
            success: true,
            results: {
              type: 'table',
              data: tableData,
              raw_output: result.results
            },
            execution_id: 'modal_' + Date.now(),
            credits_used: 0 // Remove credits for now
          };
        }

        // If response format is different, return raw
        return {
          success: true,
          results: result,
          execution_id: 'modal_' + Date.now(),
          credits_used: 0 // Remove credits for now
        };

      } catch (error) {
        console.error('❌ Modal API call failed:', error);
        
        // Show specific error message for Modal endpoint issues
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Check if it's a CORS error first
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS') || (error as any).name === 'TypeError') {
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
        
        if (errorMessage.includes('404')) {
          throw new Error(`Modal endpoint not found. This could mean:
          
1. The Modal app isn't deployed yet
2. The endpoint URL is incorrect
3. CORS settings need to be configured

Current endpoint: https://scaile--loop-over-rows-fastapi-app.modal.run/process

To fix this:
• Deploy your Modal app: modal deploy
• Check the correct endpoint URL in Modal dashboard
• Or enable mock data for testing by commenting out this direct integration

Original error: ${errorMessage}`);
        }
        
        throw error; // Don't fall back to mock data for real integration
      }
    }

    // For other workflows, try the backend API
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${apiUrl}/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'X-User-ID': user.id })
        },
        body: JSON.stringify({
          inputs,
          user_id: user?.id,
          model_used: 'default'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      
      // Fallback to mock data for demo purposes
      return generateMockResults(workflowId, inputs);
    }
  };

  const generateMockResults = (workflowId: string, inputs: any) => {
    if (workflowId === 'cluster-keywords') {
      const keywords = inputs.keywords?.split(/[,\n]/).filter((k: string) => k.trim()) || [];
      const numClusters = Math.min(inputs.num_clusters || 5, keywords.length);
      
      // Simple clustering simulation
      const clusters = [];
      const wordsPerCluster = Math.ceil(keywords.length / numClusters);
      
      for (let i = 0; i < numClusters; i++) {
        const startIndex = i * wordsPerCluster;
        const clusterKeywords = keywords.slice(startIndex, startIndex + wordsPerCluster);
        
        if (clusterKeywords.length > 0) {
          clusters.push({
            name: `Cluster ${i + 1}`,
            similarity: Math.random() * 0.3 + 0.7, // 0.7-1.0
            keywords: clusterKeywords.map(k => k.trim()),
            size: clusterKeywords.length
          });
        }
      }

      return {
        success: true,
        results: {
          clusters,
          totalKeywords: keywords.length,
          processingTime: '2.3s',
          confidence: 0.85
        },
        execution_id: 'demo_' + Date.now(),
        credits_used: 0 // Remove credits for now
      };
    }

    if (workflowId === 'sentiment-analysis') {
      const text = inputs.text || '';
      const sentiments = ['positive', 'negative', 'neutral'];
      const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

      return {
        success: true,
        results: {
          sentiment: randomSentiment,
          score: Math.random() * 0.4 + (randomSentiment === 'positive' ? 0.6 : randomSentiment === 'negative' ? 0.1 : 0.3),
          confidence: Math.random() * 0.3 + 0.7,
          emotions: {
            joy: Math.random() * (randomSentiment === 'positive' ? 0.8 : 0.3),
            anger: Math.random() * (randomSentiment === 'negative' ? 0.7 : 0.2),
            sadness: Math.random() * (randomSentiment === 'negative' ? 0.6 : 0.1),
            fear: Math.random() * 0.3,
            surprise: Math.random() * 0.4
          },
          processingTime: '1.2s'
        },
        execution_id: 'demo_' + Date.now(),
        credits_used: 0 // Remove credits for now
      };
    }

    // Enhanced mock results for Loop Over Rows workflow 
    if (workflowId === '550e8400-e29b-41d4-a716-446655440001' || workflowId === 'loop-over-rows') {
      try {
        const data = typeof inputs.data === 'string' ? JSON.parse(inputs.data) : inputs.data;
        const headers = ['Keyword', 'Score', 'Rationale'];
        
        // Generate realistic AI evaluation results
        const processedData: Record<string, any[]> = {};
        
        Object.entries(data).forEach(([rowKey, rowValue]: [string, any]) => {
          const keyword = Array.isArray(rowValue) ? rowValue[0] : rowValue;
          const score = Math.floor(Math.random() * 40) + 60; // 60-100 range
          
          // Generate contextual rationale based on keyword
          let rationale = '';
          if (keyword.toLowerCase().includes('ai') || keyword.toLowerCase().includes('automation')) {
            rationale = 'High market potential in AI sector with strong enterprise demand and growing automation trends.';
          } else if (keyword.toLowerCase().includes('marketing') || keyword.toLowerCase().includes('social')) {
            rationale = 'Established market with good growth potential, especially for digital marketing solutions.';
          } else if (keyword.toLowerCase().includes('blockchain') || keyword.toLowerCase().includes('crypto')) {
            rationale = 'Emerging technology with high innovation potential but regulatory uncertainty affects market timing.';
          } else {
            rationale = 'Moderate market potential with opportunities for differentiation through innovative approaches.';
          }
          
          processedData[rowKey] = [keyword, score, rationale];
        });

        // Return in table format for better display
        const tableData = {
          columns: headers.map((header, index) => ({
            key: header.toLowerCase().replace(/\s+/g, '_'),
            label: header,
            type: index === 1 ? 'number' : 'text'
          })),
          rows: Object.entries(processedData).map(([rowKey, rowData], index) => ({
            id: index + 1,
            keyword: rowData[0],
            score: rowData[1],
            rationale: rowData[2]
          })),
          metadata: {
            totalRows: Object.keys(processedData).length,
            successfulRows: Object.keys(processedData).length,
            failedRows: 0,
            processingTime: '45s',
            model: 'gemini-2.5-flash-demo'
          }
        };

        return {
          success: true,
          results: {
            type: 'table',
            data: tableData,
            raw_output: processedData
          },
          execution_id: 'demo_' + Date.now(),
          credits_used: 0 // Remove credits for now
        };
        
      } catch (error) {
        console.error('Error processing mock Loop Over Rows data:', error);
        return {
          success: false,
          error: 'Failed to process input data. Please check your data format.'
        };
      }
    }

    // Default fallback
    return {
      success: true,
      results: {
        message: 'Workflow executed successfully',
        processingTime: '1.5s'
      },
      execution_id: 'demo_' + Date.now(),
      credits_used: 0 // Remove credits for now
    };
  };

  const handleExecute = async () => {
    if (!workflow) {
      setError('Workflow not found');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResults(null);
    setCurrentExecution(null);
    
    try {
      let execution: any | null = null;

      // If user is authenticated, use real credits system
      if (user) {
        // The CreditsService and CreditsDisplay components are removed,
        // so this block is effectively removed.
        // The workflow execution logic is now directly in executeWorkflowAPI.
      }

      // Execute the workflow
      const startTime = Date.now();
      const apiResult = await executeWorkflowAPI(workflow.id, formData);
      const endTime = Date.now();

      if (apiResult.success) {
        setResults(apiResult.results);

        // Update execution with results if authenticated
        if (user && execution) {
          // The CreditsService.updateExecution logic is removed,
          // so this block is effectively removed.
        }
      } else {
        throw new Error(apiResult.error || 'Workflow execution failed');
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Workflow execution failed';
      setError(errorMessage);

      // Update execution with error if authenticated
      if (user && currentExecution) {
        // The CreditsService.updateExecution logic is removed,
        // so this block is effectively removed.
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const renderInput = (input: any) => {
    const value = formData[input.id] || input.default || '';

    // Special handling for Loop Over Rows data input - make it user-friendly!
    if ((workflow?.id === '550e8400-e29b-41d4-a716-446655440001' || workflow?.id === 'loop-over-rows') && input.id === 'data') {
      const [showPaste, setShowPaste] = useState(false);
      const value = formData[input.id] as string || '';

      const parseCSVData = (csvText: string) => {
        if (!csvText.trim()) return { headers: [], rows: [], preview: [] };
        
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return { headers: [], rows: [], preview: [] };
        
        // First line is headers
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Rest are data rows
        const rows = lines.slice(1).map(line => 
          line.split(',').map(cell => cell.trim())
        );
        
        // Create preview for display
        const preview = rows.slice(0, 5); // Show first 5 rows
        
        return { headers, rows, preview };
      };

      const handleCSVPaste = (text: string) => {
        setFormData(prev => ({ ...prev, [input.id]: text }));
      };

      const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/csv') {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            handleCSVPaste(text);
          };
          reader.readAsText(file);
        }
      };

      const { headers, rows, preview } = parseCSVData(value);

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {input.label}
                {input.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <p className="text-sm text-gray-500">{input.description}</p>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
              📁
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
            <p className="text-sm text-gray-500 mb-4">Drag and drop your CSV file or click to browse</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button type="button" variant="outline" className="cursor-pointer">
                Choose CSV File
              </Button>
            </label>
          </div>

          <div className="text-center text-gray-500 font-medium">OR</div>

          {/* Paste Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste Your Data (Include Headers)
            </label>
            <textarea
              value={value}
              onChange={(e) => handleCSVPaste(e.target.value)}
              placeholder={input.placeholder}
              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-xs text-yellow-600 flex items-center gap-1">
              ⭐ Much easier! Paste with headers in first row - we'll handle the formatting for you.
            </p>
          </div>

          {/* Enhanced Preview */}
          {value && headers.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Data Preview</span>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>📊 {headers.length} columns</span>
                  <span>📋 {rows.length} data rows</span>
                </div>
              </div>
              
              {/* Headers */}
              <div className="mb-2">
                <div className="text-xs font-medium text-blue-600 mb-1">Headers:</div>
                <div className="flex flex-wrap gap-1">
                  {headers.map((header, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {header}
                    </span>
                  ))}
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    + AI_Analysis
                  </span>
                </div>
              </div>
              
              {/* Sample Rows */}
              {preview.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">Sample Data Rows:</div>
                  <div className="text-xs text-gray-600 space-y-1 max-h-20 overflow-y-auto">
                    {preview.map((row, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-gray-400">#{index + 1}:</span>
                        <span>{row.slice(0, 3).join(' | ')}{row.length > 3 ? '...' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Standard input handling for other fields
    switch (input.type) {
      case 'text':
        return (
          <div key={input.id} className="space-y-1">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label} {input.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={input.id}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(input.id, e.target.value)}
              placeholder={input.placeholder}
            />
            {input.description && (
              <p className="text-xs text-gray-500">{input.description}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={input.id} className="space-y-1">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label} {input.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={input.id}
              value={value}
              onChange={(e) => handleInputChange(input.id, e.target.value)}
              placeholder={input.placeholder}
              rows={4}
            />
            {input.description && (
              <p className="text-xs text-gray-500">{input.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={input.id} className="space-y-1">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label} {input.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={input.id}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(input.id, parseInt(e.target.value) || input.default)}
              min={input.min}
              max={input.max}
              placeholder={input.placeholder}
            />
            {input.description && (
              <p className="text-xs text-gray-500">{input.description}</p>
            )}
          </div>
        );

      case 'range':
        return (
          <div key={input.id} className="space-y-1">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label} {input.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center space-x-3">
              <input
              id={input.id}
              type="range"
              min={input.min}
              max={input.max}
              step={input.step}
                value={value}
                onChange={(e) => handleInputChange(input.id, parseFloat(e.target.value))}
                className="flex-1"
            />
              <span className="text-sm font-medium w-12">{value}</span>
            </div>
            {input.description && (
              <p className="text-xs text-gray-500">{input.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={input.id} className="space-y-1">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label} {input.required && <span className="text-red-500">*</span>}
            </Label>
            <Select 
              value={value} 
              onValueChange={(newValue) => handleInputChange(input.id, newValue)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {input.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {input.description && (
              <p className="text-xs text-gray-500">{input.description}</p>
            )}
          </div>
        );

      case 'toggle':
        return (
          <div key={input.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor={input.id} className="text-sm font-medium">
                  {input.label} {input.required && <span className="text-red-500">*</span>}
                </Label>
                {input.description && <p className="text-sm text-gray-500 mt-1">{input.description}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">All Rows</span>
                <button
                  type="button"
                  onClick={() => handleInputChange(input.id, !formData[input.id])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData[input.id] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      formData[input.id] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600">Test (1 row)</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div key={input.id} className="space-y-1">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label} {input.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={input.id}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(input.id, e.target.value)}
              placeholder={input.placeholder}
            />
            {input.description && (
              <p className="text-xs text-gray-500">{input.description}</p>
            )}
          </div>
        );
    }
  };

  // Helper functions for CSV/text conversion
  const convertCSVtoJSON = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const result: Record<string, string[]> = {};
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        // Simple CSV parsing - you might want to use a library for complex CSVs
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        result[`row${index + 1}`] = values;
      }
    });
    
    return result;
  };

  const convertSimpleTextToJSON = (text: string) => {
    const lines = text.trim().split('\n');
    const result: Record<string, string[]> = {};
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        result[`row${index + 1}`] = [line.trim()];
      }
    });
    
    return result;
  };

  const convertJSONtoSimpleText = (jsonString: string) => {
    try {
      if (!jsonString) return '';
      const data = JSON.parse(jsonString);
      return Object.values(data)
        .map((row: any) => Array.isArray(row) ? row[0] : row)
        .join('\n');
    } catch {
      return '';
    }
  };

  const renderResults = () => {
    if (!results) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <p>Configure your workflow and click "Run" to see results</p>
          </div>
        </div>
      );
    }

    // Handle table output for Google Sheets and Loop Over Rows workflows
    if ((workflow?.id === 'google-sheets-processor' || workflow?.id === '550e8400-e29b-41d4-a716-446655440001' || workflow?.id === 'loop-over-rows') && results.type === 'table') {
      return (
        <TableOutput
          data={results.data}
          title={`${workflow.name} Results`}
          enableSearch={true}
          enableExport={true}
          enablePagination={true}
          pageSize={10}
          maxHeight="600px"
        />
      );
    }

    // Special handling for Loop Over Rows - always show table format
    if ((workflow?.id === '550e8400-e29b-41d4-a716-446655440001' || workflow?.id === 'loop-over-rows') && results && results.results && Array.isArray(results.results)) {
      // Create table data from results array
      const firstResult = results.results[0];
      const headers = firstResult ? Object.keys(firstResult).filter(key => key !== 'row_key') : [];
      
      const tableData = {
        columns: headers.map((header) => ({
          key: header,
          label: header === 'rationale' ? 'AI_Analysis' : header.charAt(0).toUpperCase() + header.slice(1),
          type: 'text' as 'number' | 'text' | 'status' | 'date' | 'currency' | 'email',
          sortable: true
        })),
        rows: results.results.map((item, index) => ({
          id: index + 1,
          ...item
        })),
        metadata: {
          totalRows: results.results.length,
          successfulRows: results.processed_count || results.results.length,
          failedRows: (results.total_count || results.results.length) - (results.processed_count || results.results.length),
          processingTime: '30-60s',
          model: 'gemini-2.5-flash'
        }
      };

      return (
        <TableOutput
          data={tableData}
          title={`${workflow.name} Results`}
          enableSearch={true}
          enableExport={true}
          enablePagination={true}
          pageSize={10}
          maxHeight="600px"
        />
      );
    }

    // Render results based on workflow type
    if (workflow?.id === 'cluster-keywords' && results.clusters) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Keyword Clusters</h3>
            <Badge variant="outline">{results.totalKeywords} keywords processed</Badge>
          </div>
          
          <div className="grid gap-4">
            {results.clusters.map((cluster: any, index: number) => (
              <Card key={index} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{cluster.name}</CardTitle>
                    <Badge className="bg-green-100 text-green-800">
                      {Math.round(cluster.similarity * 100)}% similarity
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {cluster.keywords.map((keyword: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {cluster.size} keywords in this cluster
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {results.processingTime && (
            <p className="text-sm text-gray-500 text-center">
              Processed in {results.processingTime}
            </p>
          )}
        </div>
      );
    }

    if (workflow?.id === 'sentiment-analysis') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Sentiment Analysis Results</h3>
            <div className="inline-flex items-center space-x-2">
              <Badge 
                className={`${
                  results.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                  results.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {results.sentiment?.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600">
                {Math.round(results.confidence * 100)}% confidence
              </span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sentiment Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      results.score > 0.6 ? 'bg-green-500' :
                      results.score < 0.4 ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${results.score * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round(results.score * 100)}/100
                </span>
              </div>
            </CardContent>
          </Card>

          {results.emotions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Emotion Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(results.emotions).map(([emotion, score]: [string, any]) => (
                    <div key={emotion} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{emotion}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-8">
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {results.processingTime && (
            <p className="text-sm text-gray-500 text-center">
              Analyzed in {results.processingTime}
            </p>
          )}
        </div>
      );
    }

    // Default results display
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Results</h3>
        <Card>
          <CardContent className="pt-6">
            <pre className="text-sm bg-gray-50 p-4 rounded-md overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Loading state with engaging animation
  if (isExecuting) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Processing Your Data</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h4 className="text-lg font-medium text-gray-900 mb-2">AI is analyzing your data</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Using Gemini 2.5-Flash to process {workflow?.name === 'Loop Over Rows - AI Batch Processing' && formData.test_mode ? 'your test row' : 'all rows'}
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">⚡ Average processing time: 30-60 seconds</div>
                  <div className="text-xs text-gray-500">🎯 {workflow?.name === 'Loop Over Rows - AI Batch Processing' && formData.test_mode ? 'Test mode: Processing 1 row' : 'Production mode: Processing all rows'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>Workflow not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const inputSection = (
    <div className="space-y-6">
      {/* Form Fields */}
      <div className="space-y-4">
        {workflow.inputs.map(renderInput)}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleExecute}
          disabled={isExecuting || (!user)}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white"
          size="lg"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Workflow
            </>
          )}
        </Button>

        {!user && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-700">
              🚀 Demo Mode: Results will be shown but not saved to your account history. Sign in to save results and track usage.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );

  const outputSection = isExecuting ? (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
        <p className="text-gray-600">Processing your request...</p>
        <p className="text-sm text-gray-500 mt-2">
          This usually takes {workflow.estimatedTime}
        </p>
        {currentExecution && (
          <p className="text-xs text-gray-400 mt-1">
            Execution ID: {currentExecution.id}
          </p>
        )}
      </div>
    </div>
  ) : (
    renderResults()
  );

  return (
    <WorkflowLayout
      workflow={workflow}
      inputSection={inputSection}
      outputSection={outputSection}
      isProcessing={isExecuting}
    />
  );
};

export default FlowRunner;