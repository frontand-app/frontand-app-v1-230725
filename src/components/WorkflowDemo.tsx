import React, { useState } from 'react';
import { WorkflowConfig } from '@/components/WorkflowBase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, CheckCircle, ArrowRight } from 'lucide-react';

interface WorkflowDemoProps {
  workflow: WorkflowConfig;
  isOpen: boolean;
  onClose: () => void;
  onGoToWorkflow: () => void;
}

const WorkflowDemo: React.FC<WorkflowDemoProps> = ({
  workflow,
  isOpen,
  onClose,
  onGoToWorkflow
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Sample data for different workflows
  const getSampleData = () => {
    switch (workflow.id) {
      case 'loop-over-rows':
        return {
          input: 'companies.csv (5 rows)',
          prompt: 'Find industry and employee count for each company',
          output: [
            { company: 'Apple Inc', industry: 'Consumer Electronics', employees: '150,000+' },
            { company: 'Microsoft', industry: 'Software', employees: '200,000+' },
            { company: 'Tesla', industry: 'Electric Vehicles', employees: '100,000+' }
          ]
        };
      case 'crawl4logo':
        return {
          input: 'https://apple.com, https://microsoft.com',
          output: [
            { website: 'apple.com', logo: 'apple-logo.png', status: 'Found' },
            { website: 'microsoft.com', logo: 'microsoft-logo.png', status: 'Found' }
          ]
        };
      case 'crawl4contacts':
        return {
          input: 'https://techstartup.com',
          output: [
            { name: 'John Smith', email: 'john@techstartup.com', role: 'CEO' },
            { name: 'Sarah Johnson', email: 'sarah@techstartup.com', role: 'CTO' }
          ]
        };
      default:
        return {
          input: 'Sample data...',
          output: [{ result: 'Demo result' }]
        };
    }
  };

  const sampleData = getSampleData();

  const runDemo = async () => {
    setIsRunning(true);
    setIsComplete(false);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsRunning(false);
    setIsComplete(true);
  };

  const resetDemo = () => {
    setIsRunning(false);
    setIsComplete(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <workflow.icon className="h-5 w-5 text-gray-600" />
              </div>
              {workflow.title} Demo
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Overview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              {workflow.visualExplanation?.overview || workflow.description}
            </p>
          </div>

          {/* Demo Steps */}
          <div className="space-y-4">
            {/* Input Step */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </div>
                <h3 className="font-medium text-gray-900">Sample Input</h3>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <code className="text-sm text-gray-800">{sampleData.input}</code>
              </div>
            </div>

            {/* Processing Step */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isRunning ? 'bg-orange-100 text-orange-700' : 
                  isComplete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {isComplete ? <CheckCircle className="h-4 w-4" /> : '2'}
                </div>
                <h3 className="font-medium text-gray-900">AI Processing</h3>
              </div>
              
              {!isRunning && !isComplete && (
                <Button 
                  onClick={runDemo}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Play className="h-4 w-4" />
                  Run Demo
                </Button>
              )}
              
              {isRunning && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Processing sample data...</span>
                </div>
              )}
              
              {isComplete && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Processing complete!
                  </div>
                  <Button 
                    onClick={resetDemo}
                    variant="outline"
                    size="sm"
                  >
                    Run Again
                  </Button>
                </div>
              )}
            </div>

            {/* Output Step */}
            {isComplete && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                  <h3 className="font-medium text-gray-900">Results</h3>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="space-y-2">
                    {Array.isArray(sampleData.output) ? (
                      sampleData.output.map((item, index) => (
                        <div key={index} className="text-sm">
                          {typeof item === 'object' ? (
                            <div className="flex gap-4">
                              {Object.entries(item).map(([key, value]) => (
                                                               <span key={key} className="text-gray-700">
                                 <strong>{key}:</strong> {String(value)}
                               </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-800">{item}</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-800">
                        {JSON.stringify(sampleData.output, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex gap-3">
              <Button
                onClick={onGoToWorkflow}
                className="flex-1 flex items-center justify-center gap-2"
              >
                Try with Your Data
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowDemo; 