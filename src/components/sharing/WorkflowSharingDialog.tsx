import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Share2, 
  Mail, 
  Users, 
  Globe, 
  Lock, 
  Plus,
  X,
  UserPlus,
  Building,
  FileText,
  Settings,
  Eye,
  Play,
  GitFork,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { 
  sharingManager, 
  WorkflowSharing, 
  WorkflowPermissions, 
  PERMISSION_LEVELS,
  ShareRecord 
} from '@/lib/sharing';

interface WorkflowSharingDialogProps {
  workflowId: string;
  workflowName: string;
  isCreator: boolean;
  trigger?: React.ReactNode;
  onSharingChange?: (sharing: WorkflowSharing) => void;
}

const WorkflowSharingDialog: React.FC<WorkflowSharingDialogProps> = ({
  workflowId,
  workflowName,
  isCreator,
  trigger,
  onSharingChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sharing, setSharing] = useState<WorkflowSharing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Share by email
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailPermissions, setEmailPermissions] = useState<keyof typeof PERMISSION_LEVELS>('viewer');
  
  // Share by domain
  const [domainInput, setDomainInput] = useState('');
  const [domainMessage, setDomainMessage] = useState('');
  const [domainPermissions, setDomainPermissions] = useState<keyof typeof PERMISSION_LEVELS>('viewer');

  // Load sharing configuration
  useEffect(() => {
    if (isOpen) {
      loadSharingConfig();
    }
  }, [isOpen, workflowId]);

  const loadSharingConfig = async () => {
    setLoading(true);
    try {
      // This would normally fetch from API
      const config = await sharingManager.configureWorkflowSharing(workflowId, {
        creator: 'current_user', // Would be from auth context
        visibility: 'public'
      });
      setSharing(config);
    } catch (err) {
      setError('Failed to load sharing configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = async (visibility: 'public' | 'private' | 'unlisted') => {
    if (!sharing) return;

    try {
      const updated = await sharingManager.configureWorkflowSharing(workflowId, {
        ...sharing,
        visibility
      });
      setSharing(updated);
      onSharingChange?.(updated);
    } catch (err) {
      setError('Failed to update visibility');
    }
  };

  const handleAddEmail = () => {
    if (!emailInput.trim()) return;

    const emails = emailInput.split(',').map(email => email.trim()).filter(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    });

    if (emails.length === 0) {
      setError('Please enter valid email addresses');
      return;
    }

    setEmailList(prev => [...new Set([...prev, ...emails])]);
    setEmailInput('');
    setError(null);
  };

  const handleRemoveEmail = (email: string) => {
    setEmailList(prev => prev.filter(e => e !== email));
  };

  const handleShareByEmail = async () => {
    if (!sharing || emailList.length === 0) return;

    setLoading(true);
    try {
      await sharingManager.shareWithUsers(
        workflowId,
        emailList,
        PERMISSION_LEVELS[emailPermissions],
        emailMessage,
        'current_user' // Would be from auth context
      );
      
      setEmailList([]);
      setEmailMessage('');
      await loadSharingConfig();
    } catch (err) {
      setError('Failed to share workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleShareByDomain = async () => {
    if (!sharing || !domainInput.trim()) return;

    setLoading(true);
    try {
      await sharingManager.shareWithDomain(
        workflowId,
        domainInput,
        PERMISSION_LEVELS[domainPermissions],
        domainMessage,
        'current_user' // Would be from auth context
      );
      
      setDomainInput('');
      setDomainMessage('');
      await loadSharingConfig();
    } catch (err) {
      setError('Failed to share with domain');
    } finally {
      setLoading(false);
    }
  };

  const getPermissionIcon = (permission: keyof typeof PERMISSION_LEVELS) => {
    switch (permission) {
      case 'viewer': return <Eye className="w-4 h-4" />;
      case 'executor': return <Play className="w-4 h-4" />;
      case 'collaborator': return <MessageSquare className="w-4 h-4" />;
      case 'admin': return <Settings className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      case 'unlisted': return <Eye className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share "{workflowName}"
          </DialogTitle>
          <DialogDescription>
            Manage who can access and use this workflow
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {sharing && (
          <div className="space-y-6">
            {/* Visibility Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getVisibilityIcon(sharing.visibility)}
                  Visibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Public</p>
                        <p className="text-sm text-gray-600">Anyone can find and use this workflow</p>
                      </div>
                    </div>
                    <Switch
                      checked={sharing.visibility === 'public'}
                      onCheckedChange={() => handleVisibilityChange('public')}
                      disabled={!isCreator}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium">Private</p>
                        <p className="text-sm text-gray-600">Only people you share with can access</p>
                      </div>
                    </div>
                    <Switch
                      checked={sharing.visibility === 'private'}
                      onCheckedChange={() => handleVisibilityChange('private')}
                      disabled={!isCreator}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Unlisted</p>
                        <p className="text-sm text-gray-600">Anyone with the link can access</p>
                      </div>
                    </div>
                    <Switch
                      checked={sharing.visibility === 'unlisted'}
                      onCheckedChange={() => handleVisibilityChange('unlisted')}
                      disabled={!isCreator}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sharing Options */}
            {(sharing.visibility === 'private' || sharing.visibility === 'unlisted') && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Share with People
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="email" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </TabsTrigger>
                      <TabsTrigger value="domain">
                        <Building className="w-4 h-4 mr-2" />
                        Domain
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="email" className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="email-input">Email addresses</Label>
                        <div className="flex gap-2">
                          <Input
                            id="email-input"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="user@example.com, user2@example.com"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                          />
                          <Button onClick={handleAddEmail} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {emailList.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {emailList.map((email, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {email}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0"
                                  onClick={() => handleRemoveEmail(email)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label htmlFor="email-permissions">Permissions</Label>
                          <Select value={emailPermissions} onValueChange={(value: keyof typeof PERMISSION_LEVELS) => setEmailPermissions(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PERMISSION_LEVELS).map(([key, permissions]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    {getPermissionIcon(key as keyof typeof PERMISSION_LEVELS)}
                                    <span className="capitalize">{key}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email-message">Message (optional)</Label>
                          <Textarea
                            id="email-message"
                            value={emailMessage}
                            onChange={(e) => setEmailMessage(e.target.value)}
                            placeholder="Add a personal message to your invitation..."
                            rows={3}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleShareByEmail} 
                          disabled={emailList.length === 0 || loading}
                          className="w-full"
                        >
                          Share with {emailList.length} {emailList.length === 1 ? 'person' : 'people'}
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="domain" className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="domain-input">Domain</Label>
                        <Input
                          id="domain-input"
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value)}
                          placeholder="example.com"
                        />
                        
                        <div className="space-y-2">
                          <Label htmlFor="domain-permissions">Permissions</Label>
                          <Select value={domainPermissions} onValueChange={(value: keyof typeof PERMISSION_LEVELS) => setDomainPermissions(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PERMISSION_LEVELS).map(([key, permissions]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    {getPermissionIcon(key as keyof typeof PERMISSION_LEVELS)}
                                    <span className="capitalize">{key}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="domain-message">Message (optional)</Label>
                          <Textarea
                            id="domain-message"
                            value={domainMessage}
                            onChange={(e) => setDomainMessage(e.target.value)}
                            placeholder="Add a message for everyone from this domain..."
                            rows={3}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleShareByDomain} 
                          disabled={!domainInput.trim() || loading}
                          className="w-full"
                        >
                          Share with @{domainInput}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Current Access */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Current Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sharing.allowedEmails.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Shared with individuals:</p>
                      <div className="space-y-2">
                        {sharing.allowedEmails.map((email, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{email}</span>
                            <Badge variant="secondary" className="text-xs">
                              {emailPermissions}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {sharing.allowedDomains.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Shared with domains:</p>
                      <div className="space-y-2">
                        {sharing.allowedDomains.map((domain, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">@{domain}</span>
                            <Badge variant="secondary" className="text-xs">
                              {domainPermissions}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {sharing.allowedEmails.length === 0 && sharing.allowedDomains.length === 0 && (
                    <p className="text-gray-500 text-sm">No one has been given special access yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowSharingDialog; 