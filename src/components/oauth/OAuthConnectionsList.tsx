import React, { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Trash2, 
  RefreshCw, 
  MoreHorizontal, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Settings,
  ExternalLink
} from 'lucide-react';
import { oauthManager, OAUTH_SERVICES, OAuthConnection } from '@/lib/oauth';
import { formatDistanceToNow } from 'date-fns';

interface OAuthConnectionsListProps {
  onConnectionChange?: (connections: OAuthConnection[]) => void;
  showAddButton?: boolean;
  filterByService?: string;
  className?: string;
}

const OAuthConnectionsList: React.FC<OAuthConnectionsListProps> = ({
  onConnectionChange,
  showAddButton = true,
  filterByService,
  className = ''
}) => {
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState<string | null>(null);

  // Load connections
  useEffect(() => {
    loadConnections();
  }, [filterByService]);

  const loadConnections = () => {
    setLoading(true);
    try {
      let allConnections = oauthManager.getConnections();
      
      if (filterByService) {
        allConnections = allConnections.filter(conn => conn.service === filterByService);
      }
      
      setConnections(allConnections);
      onConnectionChange?.(allConnections);
    } catch (err) {
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    setDisconnecting(connectionId);
    try {
      await oauthManager.disconnect(connectionId);
      loadConnections();
      setShowDisconnectDialog(null);
    } catch (err) {
      setError('Failed to disconnect');
    } finally {
      setDisconnecting(null);
    }
  };

  const handleRefresh = async (connectionId: string) => {
    setRefreshing(connectionId);
    try {
      await oauthManager.refreshConnection(connectionId);
      loadConnections();
    } catch (err) {
      setError('Failed to refresh connection');
    } finally {
      setRefreshing(null);
    }
  };

  const getConnectionStatus = (connection: OAuthConnection) => {
    if (!connection.isActive) {
      return { status: 'disconnected', color: 'bg-gray-500', text: 'Disconnected' };
    }

    const isExpired = oauthManager.isConnectionExpired(connection.id);
    if (isExpired) {
      return { status: 'expired', color: 'bg-red-500', text: 'Expired' };
    }

    const expiresIn = connection.expiresAt ? connection.expiresAt.getTime() - Date.now() : null;
    if (expiresIn && expiresIn < 24 * 60 * 60 * 1000) { // Less than 24 hours
      return { status: 'expiring', color: 'bg-yellow-500', text: 'Expiring Soon' };
    }

    return { status: 'connected', color: 'bg-green-500', text: 'Connected' };
  };

  const getServiceInfo = (serviceId: string) => {
    return OAUTH_SERVICES[serviceId] || { 
      name: serviceId, 
      icon: '🔗', 
      color: '#6b7280' 
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {connections.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <ExternalLink className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Connections</h3>
              <p className="text-sm">
                {filterByService
                  ? `No ${getServiceInfo(filterByService).name} connections found`
                  : 'Connect to external services to use them in your workflows'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        connections.map((connection) => {
          const service = getServiceInfo(connection.service);
          const status = getConnectionStatus(connection);
          
          return (
            <Card key={connection.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Service Info */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{service.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600">{connection.userEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.color}`} />
                      <span className="text-sm font-medium">{status.text}</span>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {status.status === 'expired' && (
                          <DropdownMenuItem 
                            onClick={() => handleRefresh(connection.id)}
                            disabled={refreshing === connection.id}
                          >
                            {refreshing === connection.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Refreshing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowDisconnectDialog(connection.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span>Connected {formatDistanceToNow(connection.connectedAt)} ago</span>
                      {connection.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {formatDistanceToNow(connection.expiresAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {connection.scopes.slice(0, 2).map((scope, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {scope.split('.').pop() || scope}
                        </Badge>
                      ))}
                      {connection.scopes.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{connection.scopes.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Disconnect Confirmation Dialog */}
      <Dialog 
        open={showDisconnectDialog !== null} 
        onOpenChange={() => setShowDisconnectDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disconnect Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect this service? This will revoke access and you'll need to reconnect to use it again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDisconnectDialog && handleDisconnect(showDisconnectDialog)}
              disabled={disconnecting !== null}
              className="flex-1"
            >
              {disconnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OAuthConnectionsList; 