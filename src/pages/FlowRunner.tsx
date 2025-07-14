
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
import { Loader2, Play, Clock, User, Star, Settings, Share2 } from 'lucide-react';
import WorkflowLayout from '@/components/WorkflowLayout';
import CreditsDisplay from '@/components/CreditsDisplay';
import { useAuth } from '@/components/auth/AuthProvider';

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

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  useEffect(() => {
    // Check for auto-filled inputs from prompt discovery
    if (location.state?.autoFilledInputs) {
      setFormData(location.state.autoFilledInputs);
    }
  }, [location.state]);

  const loadWorkflow = async () => {
    setLoading(true);
    try {
      // Mock workflow data based on ID
      const mockWorkflow: WorkflowData = {
        id: id || 'cluster-keywords',
        name: id === 'cluster-keywords' ? 'Cluster Keywords' : 'Sentiment Analysis',
        description: id === 'cluster-keywords' 
          ? 'Automatically group and categorize keywords using AI clustering algorithms'
          : 'Analyze emotional tone and sentiment in text content',
        category: 'Text Analysis',
        creator: 'CLOSED AI Team',
        rating: 4.8,
        estimatedTime: '30 seconds',
        estimatedCost: '0.5 credits',
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
        ] : [
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

  const handleExecute = async () => {
    if (!workflow) {
      setError('Workflow not found');
      return;
    }

    // Allow demo mode for testing without authentication
    if (!user) {
      setError(null);
      console.log('Running in demo mode - no authentication required');
    }

    setIsExecuting(true);
    setError(null);
    
    try {
      // Simulate workflow execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock results based on workflow type
      const mockResults = workflow.id === 'cluster-keywords' ? {
        clusters: [
          {
            name: 'Digital Marketing',
            similarity: 0.89,
            keywords: ['digital marketing', 'online marketing', 'marketing']
          },
          {
            name: 'Social Media',
            similarity: 0.92,
            keywords: ['social media', 'content marketing']
          }
        ],
        totalKeywords: formData.keywords?.split(/[,\n]/).filter((k: string) => k.trim()).length || 0,
        processingTime: '2.3s',
        actualCost: 0.5
      } : {
        sentiment: 'positive',
        confidence: 0.87,
        emotions: {
          joy: 0.72,
          satisfaction: 0.68,
          enthusiasm: 0.45
        },
        score: 0.84,
        processingTime: '1.8s',
        actualCost: 0.3
      };

      setResults(mockResults);
    } catch (err) {
      setError('Workflow execution failed');
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

    if (workflow?.id === 'cluster-keywords') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">Keywords clustered successfully!</span>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">
              Keyword Groups ({results.clusters.length} groups found)
            </h3>
            <div className="space-y-3">
              {results.clusters.map((cluster: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{cluster.name}</h4>
                    <Badge variant="secondary">
                      {(cluster.similarity * 100).toFixed(0)}% similar
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cluster.keywords.map((keyword: string, kidx: number) => (
                      <Badge key={kidx} className="bg-primary-100 text-primary-700">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Processing Time:</span>
                <p className="font-medium">{results.processingTime}</p>
              </div>
              <div>
                <span className="text-gray-600">Cost:</span>
                <p className="font-medium">{results.actualCost} credits</p>
              </div>
              <div>
                <span className="text-gray-600">Keywords Processed:</span>
                <p className="font-medium">{results.totalKeywords}</p>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">Sentiment analysis completed!</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Overall Sentiment</h4>
              <div className="flex items-center gap-2">
                <Badge className={`${
                  results.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                  results.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {results.sentiment}
                </Badge>
                <span className="text-sm text-gray-600">
                  {(results.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Emotion Breakdown</h4>
              <div className="space-y-1">
                {Object.entries(results.emotions).map(([emotion, score]) => (
                  <div key={emotion} className="flex justify-between text-sm">
                    <span className="capitalize">{emotion}:</span>
                    <span>{((score as number) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Processing Time:</span>
                <p className="font-medium">{results.processingTime}</p>
              </div>
              <div>
                <span className="text-gray-600">Cost:</span>
                <p className="font-medium">{results.actualCost} credits</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
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
        userCredits={100}
        estimatedCost={parseFloat(workflow.estimatedCost.split(' ')[0])}
        executionTime={workflow.estimatedTime}
      />

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleExecute}
          disabled={isExecuting}
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
              🚀 Demo Mode: You can run workflows without signing in. For full features, please sign in.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
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
