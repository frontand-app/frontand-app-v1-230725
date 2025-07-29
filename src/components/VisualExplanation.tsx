import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Clock, 
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface VisualExplanationStep {
  step: number;
  title: string;
  description: string;
  icon: string;
  visual_type: 'input' | 'config' | 'processing' | 'output';
  example?: string;
  details?: string;
}

interface FlowDiagramNode {
  id: string;
  label: string;
  type: 'input' | 'config' | 'processing' | 'output' | 'ai';
}

interface FlowDiagramEdge {
  from: string;
  to: string;
  label?: string;
}

interface FlowDiagram {
  type: 'linear' | 'branching' | 'circular';
  nodes: FlowDiagramNode[];
  edges: FlowDiagramEdge[];
}

interface VisualExplanationProps {
  title: string;
  overview: string;
  estimatedTime: string;
  complexity: 'easy' | 'medium' | 'advanced';
  steps: VisualExplanationStep[];
  flowDiagram?: FlowDiagram;
  useCases?: string[];
  tips?: string[];
  className?: string;
}

const VisualExplanation: React.FC<VisualExplanationProps> = ({
  title,
  overview,
  estimatedTime,
  complexity,
  steps,
  flowDiagram,
  useCases,
  tips,
  className = ""
}) => {
  // Get Lucide icon component by name
  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Info className="h-5 w-5" />;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'input': return 'bg-blue-100 border-blue-200';
      case 'config': return 'bg-purple-100 border-purple-200';
      case 'processing': return 'bg-orange-100 border-orange-200';
      case 'output': return 'bg-green-100 border-green-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'input': return 'bg-blue-500 text-white';
      case 'config': return 'bg-purple-500 text-white';
      case 'processing': return 'bg-orange-500 text-white';
      case 'ai': return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white';
      case 'output': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{title}</CardTitle>
              <CardDescription className="text-base">{overview}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={getComplexityColor(complexity)} variant="secondary">
                {complexity}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {estimatedTime}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-16 w-0.5 h-12 bg-gray-200 z-0" />
                )}
                
                <div className="flex gap-4 relative z-10">
                  {/* Step icon and number */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-lg ${getStepTypeColor(step.visual_type)} border-2 flex items-center justify-center`}>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-700">{step.step}</div>
                      <div className="text-gray-600">
                        {getIcon(step.icon)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Step content */}
                  <div className="flex-1 pt-2">
                    <h4 className="font-semibold text-lg mb-1">{step.title}</h4>
                    <p className="text-gray-600 mb-2">{step.description}</p>
                    
                    {step.example && (
                      <div className="bg-gray-50 border-l-4 border-blue-400 p-3 mb-2">
                        <p className="text-sm text-gray-700">
                          <strong>Example:</strong> {step.example}
                        </p>
                      </div>
                    )}
                    
                    {step.details && (
                      <p className="text-sm text-gray-500">{step.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flow Diagram */}
      {flowDiagram && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Process Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="flex items-center gap-4 flex-wrap justify-center">
                {flowDiagram.nodes.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium ${getNodeColor(node.type)}`}>
                      {node.label}
                    </div>
                    {index < flowDiagram.nodes.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* Flow edges with labels */}
            {flowDiagram.edges.some(edge => edge.label) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Process Details:</h5>
                <div className="space-y-1">
                  {flowDiagram.edges
                    .filter(edge => edge.label)
                    .map((edge, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        <span>{edge.label}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Use Cases */}
        {useCases && useCases.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Use Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {useCases.map((useCase, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{useCase}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {tips && tips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Tips & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VisualExplanation; 