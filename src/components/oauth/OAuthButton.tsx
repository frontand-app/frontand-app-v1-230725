import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Loader2, ExternalLink, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { oauthManager, OAUTH_SERVICES, OAuthConnection } from '@/lib/oauth';

interface OAuthButtonProps {
  serviceId: string;
  onSuccess?: (connection: OAuthConnection) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showPermissions?: boolean;
  additionalScopes?: string[];
  buttonText?: string;
  className?: string;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({
  serviceId,
  onSuccess,
  onError,
  disabled = false,
  variant = 'default',
  size = 'default',
  showPermissions = true,
  additionalScopes = [],
  buttonText,
  className = ''
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = OAUTH_SERVICES[serviceId];
  
  if (!service) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          OAuth service '{serviceId}' not found
        </AlertDescription>
      </Alert>
    );
  }

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const connection = await oauthManager.authenticate(serviceId, additionalScopes);
      onSuccess?.(connection);
      setShowDialog(false);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDirectConnect = async () => {
    if (showPermissions) {
      setShowDialog(true);
    } else {
      await handleConnect();
    }
  };

  const getPermissionDescription = (scope: string): string => {
    const descriptions: Record<string, string> = {
      'openid': 'Verify your identity',
      'profile': 'Access your basic profile information',
      'email': 'Access your email address',
      'https://www.googleapis.com/auth/spreadsheets': 'Read and write your Google Sheets',
      'https://www.googleapis.com/auth/drive.readonly': 'Read your Google Drive files',
      'user:email': 'Access your email address',
      'repo': 'Access your repositories',
      'chat:write': 'Send messages to Slack',
      'channels:read': 'Read channel information',
      'users:read': 'Read user information',
      'read': 'Read your Notion pages',
      'write': 'Create and edit Notion pages',
      'data.records:read': 'Read your Airtable records',
      'data.records:write': 'Create and edit Airtable records',
      'schema.bases:read': 'Read your Airtable base structure'
    };
    return descriptions[scope] || scope;
  };

  const allScopes = [...service.scopes, ...additionalScopes];

  return (
    <>
      <Button
        onClick={handleDirectConnect}
        disabled={disabled || isConnecting}
        variant={variant}
        size={size}
        className={`${className} ${service.color ? `border-[${service.color}]` : ''}`}
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <span className="text-lg mr-2">{service.icon}</span>
            {buttonText || `Connect ${service.name}`}
          </>
        )}
      </Button>

      {showPermissions && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{service.icon}</span>
                Connect to {service.name}
              </DialogTitle>
              <DialogDescription>
                This will allow CLOSED AI to access your {service.name} account with the following permissions:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Permissions List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Required Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {allScopes.map((scope, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">{getPermissionDescription(scope)}</p>
                        <p className="text-xs text-gray-500 mt-1">{scope}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Your credentials are securely stored and encrypted. CLOSED AI uses industry-standard OAuth 2.0 for authentication.
                </AlertDescription>
              </Alert>

              {/* Error Display */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setShowDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex-1 bg-primary-500 hover:bg-primary-600"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default OAuthButton; 