import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import WorkflowBase from '@/components/WorkflowBase';
import { getWorkflow } from '@/config/workflows';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const WorkflowRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  const workflow = getWorkflow(id);

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                Workflow Not Found
              </CardTitle>
              <CardDescription className="text-red-600">
                The workflow "{id}" doesn't exist or is not available yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">
                This workflow may be coming soon or the URL may be incorrect. 
                Please check the workflow name and try again.
              </p>
              <a href="/" className="text-blue-600 hover:text-blue-800 underline">
                ← Back to Homepage
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <WorkflowBase config={workflow} />;
};

export default WorkflowRunner; 