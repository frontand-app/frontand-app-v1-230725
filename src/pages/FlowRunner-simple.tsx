import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, AlertCircle, Upload, FileText } from 'lucide-react';
import { TableOutput, TableData } from '@/components/TableOutput';

const LoopOverRowsRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [csvData, setCsvData] = useState('');
  const [prompt, setPrompt] = useState('Analyze this data and provide insights');
  const [testMode, setTestMode] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [parsedData, setParsedData] = useState<{headers: string[], rows: string[][]} | null>(null);

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
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );
    
    return { headers, rows };
  };

  const handleTextInput = (value: string) => {
    setCsvData(value);
    const parsed = parseCSVData(value);
    setParsedData(parsed);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
        const parsed = parseCSVData(content);
        setParsedData(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handleExecute = async () => {
    if (!csvData.trim() || !parsedData) {
      setError('Please provide valid CSV data with headers');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      // Format data for Modal API - convert CSV to row-keyed dictionary format
      const rowsToProcess = testMode ? parsedData.rows.slice(0, 1) : parsedData.rows;
      
      // Convert rows to row-keyed dictionary format as expected by Modal
      const dataDict: Record<string, Record<string, string>> = {};
      rowsToProcess.forEach((row, index) => {
        const rowKey = `row_${index + 1}`;
        const rowObj: Record<string, string> = {};
        parsedData.headers.forEach((header, headerIndex) => {
          rowObj[header] = row[headerIndex] || '';
        });
        dataDict[rowKey] = rowObj;
      });
      
      const requestData = {
        data: dataDict,
        headers: parsedData.headers,
        prompt: prompt.trim(),
        batch_size: 10
      };

      console.log('Sending request:', requestData);

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
      setResults(result);
    } catch (err: any) {
      console.error('Execution error:', err);
      setError(err.message || 'Failed to execute workflow');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INPUT SECTION */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📥 Input
              </CardTitle>
              <CardDescription>
                🔄 Loop Over Rows - AI Batch Processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Method Selector */}
              <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'text' | 'file')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Paste CSV
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload CSV
                  </TabsTrigger>
                </TabsList>
                
                {/* Static height container to prevent jumping */}
                <div className="min-h-[160px]">
                  <TabsContent value="text" className="space-y-2 mt-4">
                    <Label htmlFor="csv-data">CSV Data (with headers)</Label>
                    <Textarea
                      id="csv-data"
                      placeholder={`Name,Email,Company
John Doe,john@example.com,Tech Corp
Jane Smith,jane@example.com,Innovation Inc`}
                      value={csvData}
                      onChange={(e) => handleTextInput(e.target.value)}
                      className="min-h-[120px] font-mono text-sm"
                    />
                  </TabsContent>
                  
                  <TabsContent value="file" className="space-y-2 mt-4">
                    <Label htmlFor="csv-file">Upload CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                    {csvData && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <span className="text-green-600">✓</span> File loaded successfully
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>

              {/* Data Preview - Static height container */}
              <div className="min-h-[120px]">
                {parsedData && (
                  <Card className="bg-gray-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Data Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="font-mono">
                          <div className="font-semibold text-blue-600">
                            Headers: {parsedData.headers.join(' | ')}
                          </div>
                          {parsedData.rows.slice(0, 2).map((row, idx) => (
                            <div key={idx} className="text-gray-700">
                              Row {idx + 1}: {row.join(' | ')}
                            </div>
                          ))}
                          {parsedData.rows.length > 2 && (
                            <div className="text-gray-500">
                              ... and {parsedData.rows.length - 2} more rows
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                    {testMode ? 'Process only 1 row' : `Process all ${parsedData?.rows.length || 0} rows`}
                  </p>
                </div>
              </div>

              {/* Execute Button */}
              <Button
                onClick={handleExecute}
                disabled={isExecuting || !parsedData}
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

        {/* OUTPUT SECTION */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📤 Output
              </CardTitle>
              <CardDescription>
                AI processing results will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Loading State */}
              {isExecuting && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  <div className="text-center">
                    <h3 className="font-semibold">Processing with Gemini 2.5-Flash</h3>
                    <p className="text-sm text-gray-600">
                      {testMode ? 'Analyzing 1 row...' : `Analyzing ${parsedData?.rows.length || 0} rows...`}
                    </p>
                  </div>
                </div>
              )}

              {/* Results Display */}
              {results && results.results && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    ✅ Processed {Array.isArray(results.results) ? results.results.length : 1} row(s) successfully
                  </div>
                  <TableOutput data={{
                    columns: Object.keys(results.results[0] || {}).map(key => ({
                      key,
                      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                      type: 'text' as const,
                      sortable: true
                    })),
                    rows: Array.isArray(results.results) ? results.results : [results.results]
                  }} />
                </div>
              )}

              {/* Empty State */}
              {!isExecuting && !results && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <div className="text-center">
                    <p>No results yet</p>
                    <p className="text-sm">Execute the workflow to see AI processing results</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoopOverRowsRunner; 