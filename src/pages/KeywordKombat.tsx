import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Calendar, Download, ChevronDown, Heart, Eye, Info, ArrowDown } from "lucide-react";


const KeywordKombat = () => {
  const [step, setStep] = useState(1); // 1: empty form, 2: filled form, 3: results
  const [mockMode, setMockMode] = useState(true);
  const [keywords, setKeywords] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [keywordVariable, setKeywordVariable] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const mockResults = [
    { keyword: "music", score: "0.8", reasoning: "Music is a core focus of the platform, central to its..." },
    { keyword: "streaming", score: "0.95", reasoning: "The company is explicitly described as a streamin..." },
    { keyword: "subscription", score: "0.85", reasoning: "The business model is primarily subscription-based." },
    { keyword: "AI", score: "0.3", reasoning: "No mention of AI; possible light use in personaliza..." },
    { keyword: "ads", score: "0.2", reasoning: "Ads are part of the freemium model, but not emph..." },
    { keyword: "blockchain", score: "0", reasoning: "No mention or implication of blockchain or crypto-..." },
    { keyword: "mobile app", score: "0.6", reasoning: "Spotify's core user experience is delivered via a m..." }
  ];

  const handleRunWorkflow = () => {
    if (step === 1) {
      // Fill form with mock data
      setKeywords("music\nstreaming\nsubscription");
      setCompanyUrl("https://www.spotify.com/");
      setKeywordVariable("keyword");
      setUploadedFile("company_list_august2025.csv (35KB)");
      setStep(2);
    } else if (step === 2) {
      // Show results
      setStep(3);
    }
  };

  const handleReset = () => {
    setStep(1);
    setKeywords("");
    setCompanyUrl("");
    setKeywordVariable("");
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen bg-background">

      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-secondary rounded-full px-3 py-1 text-sm">
            Loop Over Rows
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">KEYWORD KOMBAT</h1>
              <ChevronDown className="h-5 w-5" />
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

        <p className="text-muted-foreground mb-6">
          Score keywords based on company description
        </p>

        {/* Mock Mode Toggle */}
        <div className="flex items-center gap-3 mb-8">
          <Switch 
            checked={mockMode} 
            onCheckedChange={setMockMode}
            className="data-[state=checked]:bg-foreground"
          />
          <span className="font-medium text-foreground">Mock mode</span>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className={`border-2 ${step === 3 ? 'opacity-50' : 'border-primary'} rounded-2xl`}>
            <CardContent className="p-6">
              <div className="bg-primary text-primary-foreground rounded-lg px-3 py-1 text-sm font-medium inline-block mb-6">
                YOUR INPUT
              </div>

              <div className="space-y-6">
                {/* Step 1: File Upload */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">
                    1. {step >= 2 ? "Upload your CSV file with the keywords you would like to rank*" : "Upload a file or paste a list with the keywords you would like to rank*"}
                  </h3>
                  
                  {step >= 2 && uploadedFile ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-foreground">Keyword</div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {keywords.split('\n').map((keyword, idx) => (
                          <div key={idx}>{keyword}</div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-foreground">✓ {uploadedFile}</span>
                        <Button variant="outline" size="sm">Upload new</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                        <p className="font-medium text-foreground mb-2">Upload a CSV or XLSX file up to 10 MB.</p>
                        <p className="text-sm text-muted-foreground">Please include headers in the first row.</p>
                      </div>
                      
                      <Textarea
                        placeholder="Paste your keyword list here."
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </>
                  )}
                </div>

                {/* Step 2: Input Fields */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">2. Provide input fields*</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-foreground mb-2 block">Map keyword variable</label>
                      <Select value={keywordVariable} onValueChange={setKeywordVariable}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyword">keyword</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm text-foreground mb-2 block">Enter company URL</label>
                      <Input
                        placeholder="https://www.example.com/"
                        value={companyUrl}
                        onChange={(e) => setCompanyUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Run Buttons */}
                <div className="flex items-center gap-3">
                  <Button 
                    size="icon"
                    variant="outline"
                    className="h-12 w-12 rounded-full border-2"
                  >
                    <Calendar className="h-5 w-5" />
                  </Button>
                  <Button 
                    onClick={handleRunWorkflow}
                    className={`flex-1 py-6 text-sm font-medium rounded-full ${
                      step === 2 ? 'bg-foreground hover:bg-foreground/90 text-background' : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    RUN WORKFLOW
                    <div className="ml-2">→</div>
                  </Button>
                </div>

                {step === 3 && (
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    Reset Workflow
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className={`border-2 ${step === 3 ? 'border-primary' : 'border-border'} rounded-2xl`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className={`${step === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} rounded-lg px-3 py-1 text-sm font-medium`}>
                  WORKFLOW OUTPUT
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>⚡</span>
                  <span>Powered By Gemini 2.5 Flash</span>
                  <Info className="h-4 w-4" />
                </div>
              </div>

              {step === 3 ? (
                <div className="space-y-4">
                  <div className="bg-secondary rounded-lg overflow-hidden">
                    <div className="grid grid-cols-3 gap-4 p-3 border-b border-border bg-muted/50">
                      <div className="font-medium text-sm">Keyword</div>
                      <div className="font-medium text-sm">Score</div>
                      <div className="font-medium text-sm">AI Reasoning</div>
                    </div>
                    
                    {mockResults.map((result, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-4 p-3 border-b border-border last:border-b-0">
                        <div className="text-sm font-medium">{result.keyword}</div>
                        <div className="text-sm">{result.score}</div>
                        <div className="text-sm text-muted-foreground truncate" title={result.reasoning}>
                          {result.reasoning}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button className="w-full bg-foreground hover:bg-foreground/90 text-background py-6">
                    <Download className="h-4 w-4 mr-2" />
                    DOWNLOAD (CSV, XLSX, TXT)
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">1</div>
                    <span className="text-foreground">Company crawl for business info</span>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <div className="text-foreground">Loop: Scoring for each keyword based on company info</div>
                      <div className="text-sm text-muted-foreground">Output: Suitability score, AI reasoning</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">3</div>
                    <span className="text-foreground">Aggregate output in one file.</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default KeywordKombat;