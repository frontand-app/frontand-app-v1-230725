/**
 * Workflow Sharing System
 * 
 * Handles private workflow sharing with email/domain permissions,
 * bulk invitations, and access control management.
 */

export interface WorkflowSharing {
  workflowId: string;
  visibility: 'public' | 'private' | 'unlisted';
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Access control
  allowedUsers: string[];
  allowedDomains: string[];
  allowedEmails: string[];
  
  // Permissions
  permissions: {
    canView: boolean;
    canExecute: boolean;
    canFork: boolean;
    canComment: boolean;
    canShare: boolean;
  };
  
  // Invitation settings
  invitationSettings: {
    requireApproval: boolean;
    maxUsers: number | null;
    expiresAt: Date | null;
    allowSelfSignup: boolean;
  };
  
  // Analytics
  shares: ShareRecord[];
  accessLog: AccessLogEntry[];
}

export interface ShareRecord {
  id: string;
  workflowId: string;
  sharedBy: string;
  sharedWith: string;
  shareType: 'email' | 'domain' | 'link';
  permissions: WorkflowPermissions;
  createdAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  lastAccessAt: Date | null;
}

export interface WorkflowPermissions {
  canView: boolean;
  canExecute: boolean;
  canFork: boolean;
  canComment: boolean;
  canShare: boolean;
}

export interface AccessLogEntry {
  id: string;
  workflowId: string;
  userId: string;
  action: 'view' | 'execute' | 'fork' | 'comment' | 'share';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BulkInvitation {
  id: string;
  workflowId: string;
  createdBy: string;
  createdAt: Date;
  
  // Invitation details
  invitationType: 'email_list' | 'domain' | 'csv_upload';
  targets: string[];
  message: string;
  permissions: WorkflowPermissions;
  
  // Settings
  expiresAt: Date | null;
  requireApproval: boolean;
  maxUses: number | null;
  
  // Results
  sent: number;
  accepted: number;
  rejected: number;
  pending: number;
  
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ShareInvitation {
  id: string;
  workflowId: string;
  workflowName: string;
  invitedBy: string;
  invitedByName: string;
  invitedUser: string;
  permissions: WorkflowPermissions;
  message: string;
  createdAt: Date;
  expiresAt: Date | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

// Default permissions
export const DEFAULT_PERMISSIONS: WorkflowPermissions = {
  canView: true,
  canExecute: true,
  canFork: false,
  canComment: false,
  canShare: false
};

export const PERMISSION_LEVELS = {
  viewer: {
    canView: true,
    canExecute: true,
    canFork: false,
    canComment: false,
    canShare: false
  },
  executor: {
    canView: true,
    canExecute: true,
    canFork: true,
    canComment: false,
    canShare: false
  },
  collaborator: {
    canView: true,
    canExecute: true,
    canFork: true,
    canComment: true,
    canShare: false
  },
  admin: {
    canView: true,
    canExecute: true,
    canFork: true,
    canComment: true,
    canShare: true
  }
};

export class WorkflowSharingManager {
  private static instance: WorkflowSharingManager;
  private sharingConfigs: Map<string, WorkflowSharing> = new Map();
  private shareRecords: Map<string, ShareRecord[]> = new Map();
  private invitations: Map<string, ShareInvitation[]> = new Map();

  static getInstance(): WorkflowSharingManager {
    if (!WorkflowSharingManager.instance) {
      WorkflowSharingManager.instance = new WorkflowSharingManager();
    }
    return WorkflowSharingManager.instance;
  }

  /**
   * Configure workflow sharing settings
   */
  async configureWorkflowSharing(
    workflowId: string,
    config: Partial<WorkflowSharing>
  ): Promise<WorkflowSharing> {
    const existing = this.sharingConfigs.get(workflowId);
    
    const sharing: WorkflowSharing = {
      workflowId,
      visibility: config.visibility || 'public',
      creator: config.creator || 'unknown',
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
      allowedUsers: config.allowedUsers || [],
      allowedDomains: config.allowedDomains || [],
      allowedEmails: config.allowedEmails || [],
      permissions: config.permissions || DEFAULT_PERMISSIONS,
      invitationSettings: config.invitationSettings || {
        requireApproval: false,
        maxUsers: null,
        expiresAt: null,
        allowSelfSignup: false
      },
      shares: existing?.shares || [],
      accessLog: existing?.accessLog || []
    };

    this.sharingConfigs.set(workflowId, sharing);
    return sharing;
  }

  /**
   * Share workflow with specific users by email
   */
  async shareWithUsers(
    workflowId: string,
    emails: string[],
    permissions: WorkflowPermissions,
    message?: string,
    sharedBy?: string
  ): Promise<ShareRecord[]> {
    const sharing = this.sharingConfigs.get(workflowId);
    if (!sharing) {
      throw new Error('Workflow sharing not configured');
    }

    const shares: ShareRecord[] = [];
    
    for (const email of emails) {
      const shareRecord: ShareRecord = {
        id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        sharedBy: sharedBy || 'system',
        sharedWith: email,
        shareType: 'email',
        permissions,
        createdAt: new Date(),
        acceptedAt: null,
        revokedAt: null,
        lastAccessAt: null
      };

      shares.push(shareRecord);
      
      // Create invitation
      const invitation: ShareInvitation = {
        id: shareRecord.id,
        workflowId,
        workflowName: `Workflow ${workflowId}`, // Would be fetched from workflow service
        invitedBy: sharedBy || 'system',
        invitedByName: 'System', // Would be fetched from user service
        invitedUser: email,
        permissions,
        message: message || 'You have been invited to access this workflow',
        createdAt: new Date(),
        expiresAt: sharing.invitationSettings.expiresAt,
        status: 'pending'
      };

      // Store invitation
      const existingInvitations = this.invitations.get(email) || [];
      this.invitations.set(email, [...existingInvitations, invitation]);
    }

    // Update sharing config
    sharing.allowedEmails = [...new Set([...sharing.allowedEmails, ...emails])];
    sharing.shares = [...sharing.shares, ...shares];
    sharing.updatedAt = new Date();

    // Store share records
    const existingShares = this.shareRecords.get(workflowId) || [];
    this.shareRecords.set(workflowId, [...existingShares, ...shares]);

    return shares;
  }

  /**
   * Share workflow with domain (bulk invitation)
   */
  async shareWithDomain(
    workflowId: string,
    domain: string,
    permissions: WorkflowPermissions,
    message?: string,
    sharedBy?: string
  ): Promise<BulkInvitation> {
    const sharing = this.sharingConfigs.get(workflowId);
    if (!sharing) {
      throw new Error('Workflow sharing not configured');
    }

    const bulkInvitation: BulkInvitation = {
      id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      createdBy: sharedBy || 'system',
      createdAt: new Date(),
      invitationType: 'domain',
      targets: [domain],
      message: message || `You have been invited to access this workflow via your ${domain} email`,
      permissions,
      expiresAt: sharing.invitationSettings.expiresAt,
      requireApproval: sharing.invitationSettings.requireApproval,
      maxUses: sharing.invitationSettings.maxUsers,
      sent: 0,
      accepted: 0,
      rejected: 0,
      pending: 0,
      status: 'pending'
    };

    // Update sharing config
    sharing.allowedDomains = [...new Set([...sharing.allowedDomains, domain])];
    sharing.updatedAt = new Date();

    return bulkInvitation;
  }

  /**
   * Bulk invite from CSV data
   */
  async bulkInviteFromCSV(
    workflowId: string,
    csvData: string,
    permissions: WorkflowPermissions,
    message?: string,
    sharedBy?: string
  ): Promise<BulkInvitation> {
    // Parse CSV data
    const emails = this.parseCSVEmails(csvData);
    
    const bulkInvitation: BulkInvitation = {
      id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      createdBy: sharedBy || 'system',
      createdAt: new Date(),
      invitationType: 'csv_upload',
      targets: emails,
      message: message || 'You have been invited to access this workflow',
      permissions,
      expiresAt: null,
      requireApproval: false,
      maxUses: null,
      sent: 0,
      accepted: 0,
      rejected: 0,
      pending: emails.length,
      status: 'processing'
    };

    // Process invitations
    try {
      await this.shareWithUsers(workflowId, emails, permissions, message, sharedBy);
      bulkInvitation.sent = emails.length;
      bulkInvitation.status = 'completed';
    } catch (error) {
      bulkInvitation.status = 'failed';
    }

    return bulkInvitation;
  }

  /**
   * Check if user has access to workflow
   */
  async checkAccess(
    workflowId: string,
    userEmail: string
  ): Promise<{ hasAccess: boolean; permissions: WorkflowPermissions | null }> {
    const sharing = this.sharingConfigs.get(workflowId);
    if (!sharing) {
      return { hasAccess: false, permissions: null };
    }

    // Public workflows are accessible to everyone
    if (sharing.visibility === 'public') {
      return { hasAccess: true, permissions: sharing.permissions };
    }

    // Check if user is creator
    if (sharing.creator === userEmail) {
      return { hasAccess: true, permissions: PERMISSION_LEVELS.admin };
    }

    // Check direct email access
    if (sharing.allowedEmails.includes(userEmail)) {
      return { hasAccess: true, permissions: sharing.permissions };
    }

    // Check domain access
    const userDomain = userEmail.split('@')[1];
    if (sharing.allowedDomains.includes(userDomain)) {
      return { hasAccess: true, permissions: sharing.permissions };
    }

    // Check share records for specific permissions
    const shares = this.shareRecords.get(workflowId) || [];
    const userShare = shares.find(share => 
      share.sharedWith === userEmail && 
      share.revokedAt === null &&
      share.acceptedAt !== null
    );

    if (userShare) {
      return { hasAccess: true, permissions: userShare.permissions };
    }

    return { hasAccess: false, permissions: null };
  }

  /**
   * Accept workflow invitation
   */
  async acceptInvitation(invitationId: string, userEmail: string): Promise<void> {
    const userInvitations = this.invitations.get(userEmail) || [];
    const invitation = userInvitations.find(inv => inv.id === invitationId);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is not pending');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      throw new Error('Invitation has expired');
    }

    // Update invitation status
    invitation.status = 'accepted';

    // Update share record
    const shares = this.shareRecords.get(invitation.workflowId) || [];
    const shareRecord = shares.find(share => share.id === invitationId);
    if (shareRecord) {
      shareRecord.acceptedAt = new Date();
    }

    // Log access
    this.logAccess(invitation.workflowId, userEmail, 'view');
  }

  /**
   * Revoke workflow access
   */
  async revokeAccess(workflowId: string, userEmail: string): Promise<void> {
    const sharing = this.sharingConfigs.get(workflowId);
    if (!sharing) {
      throw new Error('Workflow sharing not configured');
    }

    // Remove from allowed emails
    sharing.allowedEmails = sharing.allowedEmails.filter(email => email !== userEmail);

    // Revoke share records
    const shares = this.shareRecords.get(workflowId) || [];
    shares.forEach(share => {
      if (share.sharedWith === userEmail) {
        share.revokedAt = new Date();
      }
    });

    // Update invitations
    const userInvitations = this.invitations.get(userEmail) || [];
    userInvitations.forEach(invitation => {
      if (invitation.workflowId === workflowId) {
        invitation.status = 'rejected';
      }
    });

    sharing.updatedAt = new Date();
  }

  /**
   * Get user's invitations
   */
  getUserInvitations(userEmail: string): ShareInvitation[] {
    return this.invitations.get(userEmail) || [];
  }

  /**
   * Get workflow sharing analytics
   */
  getWorkflowAnalytics(workflowId: string): {
    totalShares: number;
    activeUsers: number;
    recentActivity: AccessLogEntry[];
    sharesByType: Record<string, number>;
  } {
    const sharing = this.sharingConfigs.get(workflowId);
    const shares = this.shareRecords.get(workflowId) || [];
    
    if (!sharing) {
      return {
        totalShares: 0,
        activeUsers: 0,
        recentActivity: [],
        sharesByType: {}
      };
    }

    const activeShares = shares.filter(share => 
      share.acceptedAt && !share.revokedAt
    );

    const sharesByType = shares.reduce((acc, share) => {
      acc[share.shareType] = (acc[share.shareType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentActivity = sharing.accessLog
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    return {
      totalShares: shares.length,
      activeUsers: activeShares.length,
      recentActivity,
      sharesByType
    };
  }

  /**
   * Log user access to workflow
   */
  private logAccess(
    workflowId: string,
    userId: string,
    action: AccessLogEntry['action'],
    metadata?: Record<string, any>
  ): void {
    const sharing = this.sharingConfigs.get(workflowId);
    if (!sharing) return;

    const logEntry: AccessLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      userId,
      action,
      timestamp: new Date(),
      metadata
    };

    sharing.accessLog.push(logEntry);
    
    // Keep only last 1000 entries
    if (sharing.accessLog.length > 1000) {
      sharing.accessLog = sharing.accessLog.slice(-1000);
    }
  }

  /**
   * Parse CSV data to extract emails
   */
  private parseCSVEmails(csvData: string): string[] {
    const lines = csvData.split('\n').filter(line => line.trim());
    const emails: string[] = [];
    
    for (const line of lines) {
      const fields = line.split(',').map(field => field.trim().replace(/"/g, ''));
      
      // Look for email patterns in each field
      for (const field of fields) {
        if (this.isValidEmail(field)) {
          emails.push(field);
          break; // Only take first email per line
        }
      }
    }
    
    return [...new Set(emails)]; // Remove duplicates
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const sharingManager = WorkflowSharingManager.getInstance(); 