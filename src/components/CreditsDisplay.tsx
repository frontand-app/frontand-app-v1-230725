import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CreditsService, UserProfile, CreditTransaction } from '@/lib/credits';

interface CreditsDisplayProps {
  workflowId?: string;
  inputData?: any;
  modelUsed?: string;
  onInsufficientCredits?: () => void;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({
  workflowId,
  inputData,
  modelUsed,
  onInsufficientCredits
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load user profile and credit data
  const loadCreditsData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsRefreshing(true);
      
      // Get user profile
      const userProfile = await CreditsService.getUserProfile(user);
      setProfile(userProfile);

      // Get recent transactions
      const recentTransactions = await CreditsService.getCreditHistory(user.id, 5);
      setTransactions(recentTransactions);

      // Calculate estimated cost if workflow data is provided
      if (workflowId && inputData) {
        const cost = CreditsService.calculateWorkflowCost(workflowId, inputData, modelUsed);
        setEstimatedCost(cost);
      }
    } catch (error) {
      console.error('Error loading credits data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCreditsData();
  }, [user, workflowId, inputData, modelUsed]);

  // Check if user has sufficient credits
  const hasSufficientCredits = profile && estimatedCost > 0 
    ? profile.credits_balance >= estimatedCost 
    : true;

  // Get tier badge color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'bg-blue-500';
      case 'enterprise': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Format credit amount
  const formatCredits = (amount: number) => {
    return amount.toFixed(4);
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'execution': return <Clock className="h-3 w-3 text-red-600" />;
      case 'bonus': return <Coins className="h-3 w-3 text-yellow-600" />;
      case 'refund': return <TrendingUp className="h-3 w-3 text-blue-600" />;
      default: return <Coins className="h-3 w-3 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
            <span className="text-emerald-700">Loading credits...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Coins className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Demo Mode</h3>
              <p className="text-sm text-blue-700">
                Sign in to track your credits and save workflow results
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Profile</h3>
              <p className="text-sm text-red-700">Unable to load your credit information</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadCreditsData}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Credits Card */}
      <Card className={`${
        hasSufficientCredits 
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200' 
          : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Coins className={`h-8 w-8 ${
                  hasSufficientCredits ? 'text-emerald-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className={`text-lg font-semibold ${
                    hasSufficientCredits ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    {formatCredits(profile.credits_balance)} Credits
                  </h3>
                  <Badge className={`${getTierColor(profile.tier)} text-white`}>
                    {profile.tier.toUpperCase()}
                  </Badge>
                </div>
                <p className={`text-sm ${
                  hasSufficientCredits ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {profile.email}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadCreditsData}
              disabled={isRefreshing}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Estimated Cost */}
          {estimatedCost > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Estimated Cost:
                </span>
                <span className={`text-sm font-semibold ${
                  hasSufficientCredits ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCredits(estimatedCost)} credits
                </span>
              </div>
              
              {!hasSufficientCredits && (
                <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      Insufficient credits. Need {formatCredits(estimatedCost - profile.credits_balance)} more.
                    </span>
                  </div>
                  {onInsufficientCredits && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onInsufficientCredits}
                      className="mt-2 text-red-700 border-red-300 hover:bg-red-50"
                    >
                      Purchase Credits
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
              <div className="space-y-2">
                {transactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      {getTransactionIcon(transaction.transaction_type)}
                      <span className="text-gray-600 truncate max-w-32">
                        {transaction.description}
                      </span>
                    </div>
                    <span className={`font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCredits(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 
 
 