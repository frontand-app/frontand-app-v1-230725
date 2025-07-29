import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Code, 
  Book, 
  ExternalLink,
  Download,
  Eye,
  Play,
  Settings
} from 'lucide-react';

interface AppManifest {
  frontand_version: string;
  app: {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    author: string;
    tags: string[];
  };
  webhook: {
    url: string;
    timeout?: number;
  };
  inputs: any[];
  outputs: any[];
  visual_explanation?: any;
  pricing?: any;
}

interface UploadedApp {
  id: string;
  manifest: AppManifest;
  status: 'draft' | 'testing' | 'published' | 'error';
  uploadedAt: string;
  lastTested?: string;
  errors?: string[];
}

const Developer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [manifestJson, setManifestJson] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadedApps, setUploadedApps] = useState<UploadedApp[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const validateManifest = async (jsonString: string): Promise<string[]> => {
    const errors: string[] = [];
    
    try {
      const manifest = JSON.parse(jsonString) as AppManifest;
      
      // Basic structure validation
      if (!manifest.frontand_version) errors.push('Missing frontand_version');
      if (!manifest.app?.id) errors.push('Missing app.id');
      if (!manifest.app?.name) errors.push('Missing app.name');
      if (!manifest.webhook?.url) errors.push('Missing webhook.url');
      if (!manifest.inputs || !Array.isArray(manifest.inputs)) errors.push('Missing or invalid inputs array');
      if (!manifest.outputs || !Array.isArray(manifest.outputs)) errors.push('Missing or invalid outputs array');
      
      // URL validation
      if (manifest.webhook?.url && !manifest.webhook.url.startsWith('https://')) {
        errors.push('Webhook URL must use HTTPS');
      }
      
      // Input validation
      manifest.inputs?.forEach((input, index) => {
        if (!input.id) errors.push(`Input ${index}: Missing id`);
        if (!input.label) errors.push(`Input ${index}: Missing label`);
        if (!input.type) errors.push(`Input ${index}: Missing type`);
      });
      
      // Test webhook connectivity (mock for now)
      if (manifest.webhook?.url) {
        // In real implementation, we'd ping the webhook
      }
      
    } catch (e) {
      errors.push('Invalid JSON format');
    }
    
    return errors;
  };

  const handleManifestUpload = async () => {
    setIsValidating(true);
    setValidationErrors([]);
    
    const errors = await validateManifest(manifestJson);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      const manifest = JSON.parse(manifestJson) as AppManifest;
      const newApp: UploadedApp = {
        id: manifest.app.id,
        manifest,
        status: 'draft',
        uploadedAt: new Date().toISOString(),
      };
      
      setUploadedApps(prev => [...prev.filter(app => app.id !== manifest.app.id), newApp]);
      setManifestJson('');
    }
    
    setIsValidating(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setManifestJson(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setManifestJson(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const testWorkflow = async (app: UploadedApp) => {
    // Mock testing - in real implementation, we'd call the webhook with test data
    const updatedApp = {
      ...app,
      status: 'testing' as const,
      lastTested: new Date().toISOString()
    };
    
    setUploadedApps(prev => prev.map(a => a.id === app.id ? updatedApp : a));
    
    // Simulate test completion
    setTimeout(() => {
      const finalApp = {
        ...updatedApp,
        status: Math.random() > 0.3 ? 'published' as const : 'error' as const,
        errors: Math.random() > 0.3 ? undefined : ['Webhook timeout', 'Invalid response format']
      };
      setUploadedApps(prev => prev.map(a => a.id === app.id ? finalApp : a));
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Portal</h1>
          <p className="text-muted-foreground">
            Build and deploy AI workflows for the Front& platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="https://github.com/frontand-app/frontand-workflow-templates" target="_blank" rel="noopener noreferrer">
              <Book className="h-4 w-4 mr-2" />
              Documentation
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://github.com/frontand-app/frontand-workflow-templates/archive/main.zip">
              <Download className="h-4 w-4 mr-2" />
              Download Templates
            </a>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Manifest</TabsTrigger>
          <TabsTrigger value="apps">My Apps</TabsTrigger>
          <TabsTrigger value="docs">Quick Start</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload App Manifest
              </CardTitle>
              <CardDescription>
                Upload your app-manifest.json file to add a new workflow to Front&
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="manifest-upload">Upload JSON File</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag & drop your app-manifest.json here, or click to browse
                    </p>
                    <Input
                      id="manifest-upload"
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('manifest-upload')?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manifest-text">Or Paste JSON</Label>
                    <Textarea
                      id="manifest-text"
                      placeholder="Paste your app-manifest.json content here..."
                      value={manifestJson}
                      onChange={(e) => setManifestJson(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleManifestUpload}
                    disabled={!manifestJson.trim() || isValidating}
                    className="w-full"
                  >
                    {isValidating ? 'Validating...' : 'Validate & Upload'}
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label>Validation Results</Label>
                  {validationErrors.length > 0 ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Validation Errors</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  ) : manifestJson && !isValidating ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Validation Passed</AlertTitle>
                      <AlertDescription>
                        Your manifest is valid and ready to upload!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600">
                        Upload or paste your app-manifest.json to see validation results.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Workflows</CardTitle>
              <CardDescription>
                Manage your uploaded workflows and their deployment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedApps.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
                  <p className="text-gray-600 mb-4">Upload your first app manifest to get started.</p>
                  <Button onClick={() => setActiveTab('upload')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Manifest
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadedApps.map((app) => (
                    <Card key={app.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{app.manifest.app.name}</h3>
                              <Badge className={getStatusColor(app.status)}>
                                {app.status}
                              </Badge>
                              <Badge variant="outline">
                                v{app.manifest.app.version}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {app.manifest.app.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>ID: {app.manifest.app.id}</span>
                              <span>Category: {app.manifest.app.category}</span>
                              <span>Uploaded: {new Date(app.uploadedAt).toLocaleDateString()}</span>
                              {app.lastTested && (
                                <span>Last tested: {new Date(app.lastTested).toLocaleDateString()}</span>
                              )}
                            </div>
                            {app.errors && (
                              <div className="mt-2">
                                <Alert variant="destructive" className="py-2">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription className="text-sm">
                                    {app.errors.join(', ')}
                                  </AlertDescription>
                                </Alert>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testWorkflow(app)}
                              disabled={app.status === 'testing'}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {app.status === 'testing' ? 'Testing...' : 'Test'}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Quick Start Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-medium">Clone Templates</h4>
                      <p className="text-sm text-gray-600">Download our workflow templates repository</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 block">
                        git clone https://github.com/frontand-app/frontand-workflow-templates.git
                      </code>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-medium">Choose Platform</h4>
                      <p className="text-sm text-gray-600">Select from Modal Labs, Cloud Run, Vercel, or n8n</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-medium">Customize Manifest</h4>
                      <p className="text-sm text-gray-600">Edit app-manifest.json with your workflow details</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center flex-shrink-0">4</div>
                    <div>
                      <h4 className="font-medium">Deploy & Test</h4>
                      <p className="text-sm text-gray-600">Deploy your endpoint and upload the manifest here</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Example Manifest</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
{`{
  "frontand_version": "1.0",
  "app": {
    "id": "my-workflow",
    "name": "My AI Workflow",
    "description": "Description here",
    "category": "data-processing"
  },
  "webhook": {
    "url": "https://your-app.modal.run/process"
  },
  "inputs": [
    {
      "id": "text",
      "label": "Input Text",
      "type": "text",
      "required": true
    }
  ],
  "outputs": [
    {"type": "table"}
  ]
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Developer; 