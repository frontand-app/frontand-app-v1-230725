import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Play, AlertCircle, Download } from 'lucide-react';
import { TableOutput, TableData } from '@/components/TableOutput';

const LoopOverRowsRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [csvData, setCsvData] = useState('');
  const [prompt, setPrompt] = useState('Analyze this data and provide insights');
  const [testMode, setTestMode] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleExecute = async () => {
    if (!csvData.trim()) {
      setError('Please provide CSV data');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch('https://scaile--loop-over-rows-fastapi-app.modal.run/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            data: csvData,
            prompt: prompt,
            test_mode: testMode
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResults(result);
    } catch (err: any) {
      setError(err.message || 'Failed to execute workflow');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔄 Loop Over Rows - AI Batch Processing
              </CardTitle>
              <CardDescription>
                Process CSV data with AI. Each row will be analyzed with your custom prompt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CSV Data Input */}
              <div className="space-y-2">
                <Label htmlFor="csv-data">CSV Data (with headers)</Label>
                <Textarea
                  id="csv-data"
                  placeholder={`Name,Email,Company
John Doe,john@example.com,Tech Corp
Jane Smith,jane@example.com,Innovation Inc`}
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                />
                <p className="text-sm text-gray-600">
                  Paste your CSV data including headers. First row should contain column names.
                </p>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt">AI Processing Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Analyze this data and provide insights about the person's role and company"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Test Mode Toggle */}
              <div className="flex items-center space-x-3">
                <Switch
                  id="test-mode"
                  checked={testMode}
                  onCheckedChange={setTestMode}
                />
                <div>
                  <Label htmlFor="test-mode" className="text-sm font-medium">
                    Test Mode
                  </Label>
                  <p className="text-sm text-gray-600">
                    {testMode ? 'Process only 1 row' : 'Process all rows'}
                  </p>
                </div>
              </div>

              {/* Execute Button */}
              <Button
                onClick={handleExecute}
                disabled={isExecuting || !csvData.trim()}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                size="lg"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Workflow
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

        {/* Results Section */}
        <div className="space-y-6">
          {/* Loading State */}
          {isExecuting && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  <div className="text-center">
                    <h3 className="font-semibold">Processing with Gemini 2.5-Flash</h3>
                    <p className="text-sm text-gray-600">
                      {testMode ? 'Analyzing 1 row...' : 'Analyzing all rows...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {results && results.results && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Processed {Array.isArray(results.results) ? results.results.length : 1} row(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TableOutput data={{
                  columns: Object.keys(results.results[0] || {}).map(key => ({
                    key,
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    type: 'text' as const,
                    sortable: true
                  })),
                  rows: Array.isArray(results.results) ? results.results : [results.results]
                }} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoopOverRowsRunner; 