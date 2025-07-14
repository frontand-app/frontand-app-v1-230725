import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Clock, Zap, TrendingUp } from 'lucide-react';

interface CreditsDisplayProps {
  userCredits: number;
  estimatedCost: number;
  executionTime?: string;
  className?: string;
}

const CreditsDisplay: React.FC<CreditsDisplayProps> = ({
  userCredits,
  estimatedCost,
  executionTime,
  className = ''
}) => {
  const remainingCredits = userCredits - estimatedCost;
  const usagePercentage = (estimatedCost / userCredits) * 100;
  
  const getCostCategory = (cost: number) => {
    if (cost <= 0.1) return { label: 'Almost Free', color: 'bg-green-100 text-green-700', icon: '🟢' };
    if (cost <= 0.5) return { label: 'Very Cheap', color: 'bg-blue-100 text-blue-700', icon: '🔵' };
    if (cost <= 2) return { label: 'Affordable', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' };
    if (cost <= 5) return { label: 'Moderate', color: 'bg-orange-100 text-orange-700', icon: '🟠' };
    return { label: 'Premium', color: 'bg-red-100 text-red-700', icon: '🔴' };
  };

  const costCategory = getCostCategory(estimatedCost);
  const canAfford = remainingCredits >= 0;

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary-500" />
          Cost Estimation
        </CardTitle>
        <CardDescription>
          Transparent pricing with no hidden fees
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cost Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Estimated Cost:</span>
            <div className="flex items-center gap-2">
              <Badge className={`${costCategory.color} text-xs`}>
                {costCategory.icon} {costCategory.label}
              </Badge>
              <span className="font-bold text-gray-900">
                {estimatedCost} credits
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Your Balance:</span>
            <span className="font-medium text-gray-900">
              {userCredits} credits
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">After Execution:</span>
            <span className={`font-medium ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
              {remainingCredits} credits
            </span>
          </div>

          {executionTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Estimated Time:
              </span>
              <span className="font-medium text-gray-900">
                {executionTime}
              </span>
            </div>
          )}
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Credit Usage</span>
            <span className="text-gray-600">{usagePercentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={Math.min(usagePercentage, 100)} 
            className="h-2"
          />
        </div>

        {/* Alerts */}
        {!canAfford && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700 text-sm">
              Insufficient credits. You need {Math.abs(remainingCredits)} more credits to run this workflow.
            </AlertDescription>
          </Alert>
        )}

        {canAfford && remainingCredits < 5 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-700 text-sm">
              Low credit balance. Consider purchasing more credits to continue using workflows.
            </AlertDescription>
          </Alert>
        )}

        {/* Credit Info */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>💡 1 credit = $0.01</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Pay-as-you-go
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditsDisplay; 