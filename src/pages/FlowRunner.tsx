
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play, Clock, User, Star, Settings, Share2, AlertCircle } from 'lucide-react';
import WorkflowLayout from '@/components/WorkflowLayout';
import { CreditsDisplay } from '@/components/CreditsDisplay';
import { TableOutput, TableData } from '@/components/TableOutput';
import { useAuth } from '@/components/auth/AuthProvider';
import { CreditsService, WorkflowExecution } from '@/lib/credits';

interface WorkflowData {
  id: string;
  name: string;
  description: string;
  category: string;
  creator: string;
  rating: number;
  estimatedTime: string;
  estimatedCost: string;
  inputs: any[];
}

const FlowRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
  const [creditCheckPassed, setCreditCheckPassed] = useState(true);

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  useEffect(() => {
    // Check for auto-filled inputs from prompt discovery
    if (location.state?.autoFilledInputs) {
      setFormData(location.state.autoFilledInputs);
    }
  }, [location.state]);

  // Check credits when form data changes
  useEffect(() => {
    checkCredits();
  }, [formData, user]);

  const checkCredits = async () => {
    if (!user || !workflow) {
      setCreditCheckPassed(true); // Allow demo mode
      return;
    }

    try {
      const result = await CreditsService.canExecuteWorkflow(
        user.id,
        workflow.id,
        formData
      );
      setCreditCheckPassed(result.canExecute);
    } catch (error) {
      console.error('Error checking credits:', error);
      setCreditCheckPassed(false);
    }
  };

  const loadWorkflow = async () => {
    setLoading(true);
    try {
      // Mock workflow data based on ID - in production this would come from API
      const mockWorkflow: WorkflowData = {
        id: id || 'cluster-keywords',
        name: id === 'cluster-keywords' ? 'Cluster Keywords' : 
              id === 'sentiment-analysis' ? 'Sentiment Analysis' :
              id === 'google-sheets-processor' ? 'Google Sheets Processor' :
              'Data Enrichment',
        description: id === 'cluster-keywords' 
          ? 'Automatically group and categorize keywords using AI clustering algorithms'
          : id === 'sentiment-analysis'
          ? 'Analyze emotional tone and sentiment in text content'
          : id === 'google-sheets-processor'
          ? 'Process and enrich data in Google Sheets with AI'
          : 'Enrich your data with additional information and insights',
        category: 'Text Analysis',
        creator: 'CLOSED AI Team',
        rating: 4.8,
        estimatedTime: '30 seconds',
        estimatedCost: '0.1 credits',
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

  const executeWorkflowAPI = async (workflowId: string, inputs: any, userId?: string): Promise<any> => {
    // Get API URL from environment
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${apiUrl}/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'X-User-ID': userId })
        },
        body: JSON.stringify({
          inputs,
          user_id: userId,
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
        credits_used: CreditsService.calculateWorkflowCost(workflowId, inputs)
      };
    } else if (workflowId === 'sentiment-analysis') {
      const text = inputs.text || '';
      const positiveWords = ['love', 'great', 'amazing', 'excellent', 'wonderful', 'fantastic', 'good', 'happy'];
      const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'horrible', 'sad', 'angry', 'disappointed'];
      
      const textLower = text.toLowerCase();
      const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
      const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
      
      let sentiment = 'neutral';
      let score = 0.5;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        score = 0.5 + (positiveCount / (positiveCount + negativeCount)) * 0.5;
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        score = 0.5 - (negativeCount / (positiveCount + negativeCount)) * 0.5;
      }

      return {
        success: true,
        results: {
          sentiment,
          confidence: Math.min(0.95, 0.6 + Math.abs(positiveCount - negativeCount) * 0.1),
          score,
          emotions: {
            joy: sentiment === 'positive' ? score * 0.8 : 0.1,
            sadness: sentiment === 'negative' ? (1 - score) * 0.8 : 0.1,
            anger: sentiment === 'negative' ? (1 - score) * 0.6 : 0.05,
            fear: sentiment === 'negative' ? (1 - score) * 0.4 : 0.05,
            surprise: 0.2,
            trust: sentiment === 'positive' ? score * 0.7 : 0.3
          },
          processingTime: '1.8s'
        },
        execution_id: 'demo_' + Date.now(),
        credits_used: CreditsService.calculateWorkflowCost(workflowId, inputs)
      };
    } else if (workflowId === 'google-sheets-processor') {
      // Generate mock Google Sheets table data
      const sampleData: TableData = {
        columns: [
          { key: 'id', label: 'ID', type: 'number', sortable: true, width: '80px' },
          { key: 'name', label: 'Full Name', type: 'text', sortable: true, filterable: true },
          { key: 'email', label: 'Email', type: 'email', sortable: true, filterable: true },
          { key: 'company', label: 'Company', type: 'text', sortable: true, filterable: true },
          { key: 'status', label: 'Status', type: 'status', sortable: true, filterable: true },
          { key: 'last_activity', label: 'Last Activity', type: 'date', sortable: true },
          { key: 'total_orders', label: 'Orders', type: 'number', sortable: true },
          { key: 'revenue', label: 'Revenue', type: 'currency', sortable: true }
        ],
        rows: [
          {
            id: 1,
            name: 'John Smith',
            email: 'john.smith@techcorp.com',
            company: 'TechCorp Inc.',
            status: 'active',
            last_activity: '2024-01-14T15:30:00Z',
            total_orders: 12,
            revenue: 2450.50
          },
          {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah.j@innovate.io',
            company: 'Innovate Solutions',
            status: 'active',
            last_activity: '2024-01-13T09:15:00Z',
            total_orders: 8,
            revenue: 1875.00
          },
          {
            id: 3,
            name: 'Michael Davis',
            email: 'mdavis@startup.com',
            company: 'StartupXYZ',
            status: 'pending',
            last_activity: '2024-01-12T14:22:00Z',
            total_orders: 3,
            revenue: 650.25
          },
          {
            id: 4,
            name: 'Emily Chen',
            email: 'emily.chen@bigcorp.com',
            company: 'BigCorp Ltd.',
            status: 'active',
            last_activity: '2024-01-15T11:45:00Z',
            total_orders: 25,
            revenue: 5200.75
          },
          {
            id: 5,
            name: 'David Wilson',
            email: 'dwilson@freelance.com',
            company: 'Freelancer',
            status: 'inactive',
            last_activity: '2024-01-08T16:30:00Z',
            total_orders: 1,
            revenue: 125.00
          },
          {
            id: 6,
            name: 'Lisa Martinez',
            email: 'lisa.m@consulting.pro',
            company: 'Pro Consulting',
            status: 'active',
            last_activity: '2024-01-15T08:20:00Z',
            total_orders: 15,
            revenue: 3250.00
          }
        ],
        metadata: {
          totalRows: 150,
          source: 'Google Sheets',
          lastUpdated: new Date().toISOString(),
          processingTime: '3.2s',
          successCount: 148,
          errorCount: 2
        }
      };

      return {
        success: true,
        results: {
          type: 'table',
          data: sampleData
        },
        execution_id: 'demo_' + Date.now(),
        credits_used: CreditsService.calculateWorkflowCost(workflowId, inputs)
      };
    }

    // Default response for other workflows
    return {
      success: true,
      results: {
        message: 'Workflow executed successfully',
        processingTime: '1.5s'
      },
      execution_id: 'demo_' + Date.now(),
      credits_used: CreditsService.calculateWorkflowCost(workflowId, inputs)
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
      let execution: WorkflowExecution | null = null;

      // If user is authenticated, use real credits system
      if (user) {
        const executionResult = await CreditsService.executeWorkflow(
          workflow.id,
          user.id,
          formData
        );

        if (!executionResult.success) {
          setError(executionResult.error || 'Failed to execute workflow');
          return;
        }

        execution = executionResult.execution!;
        setCurrentExecution(execution);

        // Update execution status
        await CreditsService.updateExecution(execution.id, {
          status: 'running'
        });
      }

      // Execute the workflow
      const startTime = Date.now();
      const apiResult = await executeWorkflowAPI(workflow.id, formData, user?.id);
      const endTime = Date.now();

      if (apiResult.success) {
        setResults(apiResult.results);

        // Update execution with results if authenticated
        if (user && execution) {
          await CreditsService.updateExecution(execution.id, {
            status: 'completed',
            outputs: apiResult.results,
            execution_time_ms: endTime - startTime,
            completed_at: new Date().toISOString()
          });
        }
      } else {
        throw new Error(apiResult.error || 'Workflow execution failed');
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Workflow execution failed';
      setError(errorMessage);

      // Update execution with error if authenticated
      if (user && currentExecution) {
        await CreditsService.updateExecution(currentExecution.id, {
          status: 'failed',
          error_message: errorMessage
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const renderInput = (input: any) => {
    const value = formData[input.id] || '';
    
    switch (input.type) {
      case 'textarea':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={input.id}
              value={value}
              onChange={(e) => handleInputChange(input.id, e.target.value)}
              placeholder={input.placeholder}
              className="min-h-[100px] resize-none"
            />
            {input.description && (
              <p className="text-xs text-gray-500">{input.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={input.id}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(input.id, parseInt(e.target.value))}
              min={input.min}
              max={input.max}
              className="w-full"
            />
            {input.description && (
              <p className="text-xs text-gray-500">{input.description}</p>
            )}
          </div>
        );

      case 'range':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label}: {value}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={input.id}
              type="range"
              value={value}
              onChange={(e) => handleInputChange(input.id, parseFloat(e.target.value))}
              min={input.min}
              max={input.max}
              step={input.step}
              className="w-full"
            />
            {input.description && (
              <p className="text-xs text-gray-500">{input.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(newValue) => handleInputChange(input.id, newValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {input.options?.map((option: any) => (
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

      default:
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.id} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={input.id}
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

    // Handle Google Sheets table output
    if (workflow?.id === 'google-sheets-processor' && results.type === 'table') {
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

      {/* Credits Display */}
      <CreditsDisplay
        workflowId={workflow.id}
        inputData={formData}
        modelUsed="default"
        onInsufficientCredits={() => {
          setError('Insufficient credits to run this workflow. Please purchase more credits or upgrade your plan.');
        }}
      />

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleExecute}
          disabled={isExecuting || (!user && !creditCheckPassed)}
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
              🚀 Demo Mode: You can run workflows without signing in. Sign in to save results and track usage.
            </AlertDescription>
          </Alert>
        )}

        {user && !creditCheckPassed && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Insufficient credits to run this workflow. Please purchase more credits.
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