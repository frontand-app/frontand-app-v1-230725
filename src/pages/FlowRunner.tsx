
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, DollarSign, Zap, Clock, CheckCircle } from "lucide-react";
import FormGenerator from "@/components/FormGenerator";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  text?: string;
  num_clusters?: number;
  similarity_threshold?: number;
}

// Sample flow data
const sampleFlows = {
  "cluster-keywords": {
    id: "cluster-keywords",
    name: "Cluster Keywords",
    description: "Automatically group and categorize keywords using AI clustering algorithms",
    category: "Text Analysis",
    author: "CLOSED AI Team",
    version: "1.2.0",
    inputs: [
      {
        name: "text",
        type: "text",
        label: "Text to Analyze",
        description: "Enter the text containing keywords you want to cluster",
        required: true,
        ui: {
          widget: "textarea",
          placeholder: "Enter text to analyze...\n\nExample:\nsocial media marketing\ndigital marketing\ncontent creation\nbrand awareness\ninfluencer partnerships",
          rows: 8
        }
      },
      {
        name: "num_clusters",
        type: "number",
        label: "Number of Clusters",
        description: "How many groups should the keywords be organized into?",
        default: 5,
        required: true,
        validation: {
          min: 2,
          max: 20
        },
        ui: {
          widget: "slider"
        }
      },
      {
        name: "similarity_threshold",
        type: "number",
        label: "Similarity Threshold",
        description: "Minimum similarity score for grouping (0.0 - 1.0)",
        default: 0.7,
        validation: {
          min: 0.1,
          max: 1.0,
          step: 0.1
        },
        ui: {
          widget: "slider"
        }
      }
    ]
  }
};

const aiModels = [
  { id: "gpt-4", name: "GPT-4", provider: "OpenAI", costPerToken: 0.00003, speed: "Medium", quality: "Highest" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI", costPerToken: 0.000002, speed: "Fast", quality: "High" },
  { id: "claude-3", name: "Claude 3", provider: "Anthropic", costPerToken: 0.000025, speed: "Medium", quality: "Highest" },
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google", costPerToken: 0.0000005, speed: "Fast", quality: "High" }
];

const FlowRunner = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [flow, setFlow] = useState(null);
  const [formData, setFormData] = useState<FormData>({});
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Load flow data
    if (id && sampleFlows[id]) {
      setFlow(sampleFlows[id]);
    }
  }, [id]);

  useEffect(() => {
    // Calculate estimated cost based on form data and selected model
    if (formData.text && selectedModel) {
      const model = aiModels.find(m => m.id === selectedModel);
      const estimatedTokens = Math.ceil(formData.text.length / 4); // Rough token estimation
      const cost = estimatedTokens * model.costPerToken;
      setEstimatedCost(cost);
    }
  }, [formData, selectedModel]);

  const handleFormChange = (data) => {
    setFormData(data);
  };

  const handleRunFlow = async () => {
    if (!formData.text) {
      toast({
        title: "Missing Required Field",
        description: "Please enter text to analyze before running the flow.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResults(null);

    // Simulate flow execution with progress updates
    const steps = [
      "Initializing AI model...",
      "Processing input text...",
      "Extracting keywords...",
      "Computing similarity matrix...",
      "Clustering keywords...",
      "Generating results..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(((i + 1) / steps.length) * 100);
    }

    // Mock results
    const mockResults = {
      clusters: [
        {
          id: 1,
          name: "Digital Marketing",
          keywords: ["social media marketing", "digital marketing", "brand awareness"],
          similarity: 0.85
        },
        {
          id: 2,
          name: "Content Strategy",
          keywords: ["content creation", "influencer partnerships"],
          similarity: 0.72
        }
      ],
      totalKeywords: 5,
      processingTime: "2.3s",
      tokensUsed: Math.ceil(formData.text.length / 4),
      actualCost: estimatedCost
    };

    setResults(mockResults);
    setIsRunning(false);
    
    toast({
      title: "Flow Completed Successfully",
      description: `Processed ${mockResults.totalKeywords} keywords in ${mockResults.processingTime}`,
    });
  };

  if (!flow) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Flow Not Found</h1>
          <p className="text-gray-600">The requested flow could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Flow Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{flow.category}</Badge>
              <span className="text-sm text-gray-500">v{flow.version}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{flow.name}</h1>
            <p className="text-gray-600 mb-4">{flow.description}</p>
            <p className="text-sm text-gray-500">Created by {flow.author}</p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Fill out the form below to configure your AI workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormGenerator
                schema={flow.inputs}
                onChange={handleFormChange}
                data={formData}
              />
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Results
                </CardTitle>
                <CardDescription>
                  Flow completed in {results.processingTime} • {results.tokensUsed} tokens used • ${results.actualCost.toFixed(4)} cost
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Keyword Clusters ({results.totalKeywords} keywords grouped into {results.clusters.length} clusters)</h3>
                    <div className="space-y-3">
                      {results.clusters.map((cluster) => (
                        <div key={cluster.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{cluster.name}</h4>
                            <Badge variant="outline">
                              {(cluster.similarity * 100).toFixed(0)}% similarity
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {cluster.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="secondary">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI Model
              </CardTitle>
              <CardDescription>
                Choose the AI model for processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500">{model.provider}</div>
                        </div>
                        <div className="text-xs text-right">
                          <div>Speed: {model.speed}</div>
                          <div>Quality: {model.quality}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Cost Estimation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cost Estimation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated tokens:</span>
                  <span className="text-sm font-medium">
                    {formData.text ? Math.ceil(formData.text.length / 4) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rate per token:</span>
                  <span className="text-sm font-medium">
                    ${aiModels.find(m => m.id === selectedModel)?.costPerToken.toFixed(8)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Estimated cost:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${estimatedCost.toFixed(4)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Run Button */}
          <Card>
            <CardContent className="pt-6">
              {isRunning && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Processing...</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              <Button
                onClick={handleRunFlow}
                disabled={isRunning || !formData.text}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Flow...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Flow
                  </>
                )}
              </Button>
              
              {!formData.text && (
                <Alert className="mt-4">
                  <AlertDescription>
                    Please fill out the required fields to run the flow
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlowRunner;
