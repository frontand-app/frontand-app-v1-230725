/**
 * OAuth Authentication System for External Services
 * 
 * Handles popup-based OAuth flows for various services like Google Sheets, 
 * Slack, GitHub, etc. Similar to n8n's approach.
 */

export interface OAuthService {
  id: string;
  name: string;
  icon: string;
  color: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUrl: string;
  clientId: string;
  requiresRefresh: boolean;
}

export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  scope: string;
  service: string;
  user_info?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
}

export interface OAuthConnection {
  id: string;
  service: string;
  serviceName: string;
  userEmail: string;
  userName?: string;
  avatar?: string;
  scopes: string[];
  connectedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// OAuth Service Configurations
export const OAUTH_SERVICES: Record<string, OAuthService> = {
  google: {
    id: 'google',
    name: 'Google',
    icon: '🔵',
    color: '#4285f4',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
    redirectUrl: `${window.location.origin}/oauth/callback/google`,
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
    requiresRefresh: true
  },
  
  github: {
    id: 'github',
    name: 'GitHub',
    icon: '⚫',
    color: '#333333',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['user:email', 'repo'],
    redirectUrl: `${window.location.origin}/oauth/callback/github`,
    clientId: process.env.REACT_APP_GITHUB_CLIENT_ID || '',
    requiresRefresh: false
  },
  
  slack: {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    color: '#4a154b',
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['chat:write', 'channels:read', 'users:read'],
    redirectUrl: `${window.location.origin}/oauth/callback/slack`,
    clientId: process.env.REACT_APP_SLACK_CLIENT_ID || '',
    requiresRefresh: true
  },
  
  notion: {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    color: '#000000',
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: ['read', 'write'],
    redirectUrl: `${window.location.origin}/oauth/callback/notion`,
    clientId: process.env.REACT_APP_NOTION_CLIENT_ID || '',
    requiresRefresh: false
  },
  
  airtable: {
    id: 'airtable',
    name: 'Airtable',
    icon: '🟠',
    color: '#ffb400',
    authUrl: 'https://airtable.com/oauth2/v1/authorize',
    tokenUrl: 'https://airtable.com/oauth2/v1/token',
    scopes: ['data.records:read', 'data.records:write', 'schema.bases:read'],
    redirectUrl: `${window.location.origin}/oauth/callback/airtable`,
    clientId: process.env.REACT_APP_AIRTABLE_CLIENT_ID || '',
    requiresRefresh: true
  }
};

export class OAuthManager {
  private static instance: OAuthManager;
  private connections: Map<string, OAuthConnection> = new Map();
  private pendingAuths: Map<string, { resolve: Function; reject: Function }> = new Map();

  static getInstance(): OAuthManager {
    if (!OAuthManager.instance) {
      OAuthManager.instance = new OAuthManager();
    }
    return OAuthManager.instance;
  }

  constructor() {
    // Load existing connections from localStorage
    this.loadStoredConnections();
    
    // Listen for OAuth callbacks
    window.addEventListener('message', this.handleOAuthCallback.bind(this));
  }

  /**
   * Initiate OAuth flow for a service
   */
  async authenticate(serviceId: string, additionalScopes?: string[]): Promise<OAuthConnection> {
    const service = OAUTH_SERVICES[serviceId];
    if (!service) {
      throw new Error(`OAuth service '${serviceId}' not found`);
    }

    if (!service.clientId) {
      throw new Error(`OAuth client ID not configured for '${serviceId}'`);
    }

    const state = this.generateState();
    const scopes = additionalScopes 
      ? [...service.scopes, ...additionalScopes]
      : service.scopes;

    const params = new URLSearchParams({
      client_id: service.clientId,
      redirect_uri: service.redirectUrl,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent'
    });

    const authUrl = `${service.authUrl}?${params.toString()}`;

    return new Promise((resolve, reject) => {
      // Store the promise resolvers
      this.pendingAuths.set(state, { resolve, reject });

      // Open popup window
      const popup = window.open(
        authUrl,
        'oauth_popup',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        this.pendingAuths.delete(state);
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      // Monitor popup closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          this.pendingAuths.delete(state);
          reject(new Error('OAuth flow cancelled by user'));
        }
      }, 1000);

      // Set timeout for OAuth flow
      setTimeout(() => {
        if (this.pendingAuths.has(state)) {
          clearInterval(checkClosed);
          this.pendingAuths.delete(state);
          popup.close();
          reject(new Error('OAuth flow timed out'));
        }
      }, 300000); // 5 minutes timeout
    });
  }

  /**
   * Handle OAuth callback from popup
   */
  private async handleOAuthCallback(event: MessageEvent) {
    if (event.origin !== window.location.origin) return;

    const { type, data } = event.data;
    if (type !== 'oauth_callback') return;

    const { code, state, error } = data;
    const pending = this.pendingAuths.get(state);
    
    if (!pending) return;

    this.pendingAuths.delete(state);

    if (error) {
      pending.reject(new Error(`OAuth error: ${error}`));
      return;
    }

    try {
      // Exchange code for tokens
      const connection = await this.exchangeCodeForTokens(code, state);
      
      // Store connection
      this.connections.set(connection.id, connection);
      this.saveStoredConnections();

      pending.resolve(connection);
    } catch (error) {
      pending.reject(error);
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(code: string, state: string): Promise<OAuthConnection> {
    // This would typically be done through your backend API
    // For now, we'll simulate the token exchange
    
    // In a real implementation, you'd call your backend:
    // const response = await fetch('/api/oauth/exchange', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ code, state })
    // });

    // Mock response for demonstration
    const serviceId = 'google'; // This would be extracted from state
    const service = OAUTH_SERVICES[serviceId];
    
    const mockToken: OAuthToken = {
      access_token: 'mock_access_token_' + Date.now(),
      refresh_token: 'mock_refresh_token_' + Date.now(),
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      scope: service.scopes.join(' '),
      service: serviceId,
      user_info: {
        id: 'user_' + Date.now(),
        email: 'user@example.com',
        name: 'John Doe',
        avatar: 'https://via.placeholder.com/32'
      }
    };

    const connection: OAuthConnection = {
      id: `${serviceId}_${mockToken.user_info.id}`,
      service: serviceId,
      serviceName: service.name,
      userEmail: mockToken.user_info.email,
      userName: mockToken.user_info.name,
      avatar: mockToken.user_info.avatar,
      scopes: service.scopes,
      connectedAt: new Date(),
      expiresAt: new Date(mockToken.expires_at),
      isActive: true
    };

    return connection;
  }

  /**
   * Get all active connections
   */
  getConnections(): OAuthConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.isActive);
  }

  /**
   * Get connection by ID
   */
  getConnection(id: string): OAuthConnection | undefined {
    return this.connections.get(id);
  }

  /**
   * Get connections by service
   */
  getConnectionsByService(serviceId: string): OAuthConnection[] {
    return this.getConnections().filter(conn => conn.service === serviceId);
  }

  /**
   * Disconnect (revoke) a connection
   */
  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Mark as inactive
    connection.isActive = false;
    
    // In a real implementation, you'd revoke the token on the service
    // await this.revokeToken(connection);

    this.saveStoredConnections();
  }

  /**
   * Refresh expired tokens
   */
  async refreshConnection(connectionId: string): Promise<OAuthConnection> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const service = OAUTH_SERVICES[connection.service];
    if (!service.requiresRefresh) {
      throw new Error('Service does not support token refresh');
    }

    // In a real implementation, you'd refresh the token
    // const newToken = await this.refreshToken(connection);
    
    // Mock refresh
    connection.expiresAt = new Date(Date.now() + 3600000);
    this.saveStoredConnections();

    return connection;
  }

  /**
   * Check if connection is expired
   */
  isConnectionExpired(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.expiresAt) return false;
    
    return connection.expiresAt.getTime() < Date.now();
  }

  /**
   * Generate secure random state for OAuth flow
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Load stored connections from localStorage
   */
  private loadStoredConnections(): void {
    try {
      const stored = localStorage.getItem('oauth_connections');
      if (stored) {
        const connections = JSON.parse(stored);
        connections.forEach((conn: any) => {
          // Convert date strings back to Date objects
          conn.connectedAt = new Date(conn.connectedAt);
          if (conn.expiresAt) {
            conn.expiresAt = new Date(conn.expiresAt);
          }
          this.connections.set(conn.id, conn);
        });
      }
    } catch (error) {
      console.error('Failed to load stored OAuth connections:', error);
    }
  }

  /**
   * Save connections to localStorage
   */
  private saveStoredConnections(): void {
    try {
      const connections = Array.from(this.connections.values());
      localStorage.setItem('oauth_connections', JSON.stringify(connections));
    } catch (error) {
      console.error('Failed to save OAuth connections:', error);
    }
  }
}

// Export singleton instance
export const oauthManager = OAuthManager.getInstance();

// Helper functions for specific services
export const GoogleSheetsAuth = {
  async connect(additionalScopes?: string[]): Promise<OAuthConnection> {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly',
      ...(additionalScopes || [])
    ];
    return oauthManager.authenticate('google', scopes);
  },

  async getSpreadsheets(connectionId: string): Promise<any[]> {
    const connection = oauthManager.getConnection(connectionId);
    if (!connection) {
      throw new Error('Google connection not found');
    }

    // Mock spreadsheets data
    return [
      {
        id: '1ABC123DEF456',
        name: 'My Spreadsheet',
        url: 'https://docs.google.com/spreadsheets/d/1ABC123DEF456/edit',
        sheets: ['Sheet1', 'Sheet2', 'Data']
      },
      {
        id: '2GHI789JKL012',
        name: 'Sales Data',
        url: 'https://docs.google.com/spreadsheets/d/2GHI789JKL012/edit',
        sheets: ['Q1', 'Q2', 'Q3', 'Q4']
      }
    ];
  }
};

export const SlackAuth = {
  async connect(): Promise<OAuthConnection> {
    return oauthManager.authenticate('slack');
  },

  async getChannels(connectionId: string): Promise<any[]> {
    // Mock channels data
    return [
      { id: 'C1234567890', name: 'general' },
      { id: 'C0987654321', name: 'random' },
      { id: 'C1122334455', name: 'notifications' }
    ];
  }
};

export const GitHubAuth = {
  async connect(): Promise<OAuthConnection> {
    return oauthManager.authenticate('github');
  },

  async getRepositories(connectionId: string): Promise<any[]> {
    // Mock repositories data
    return [
      { id: 123, name: 'my-project', full_name: 'user/my-project', private: false },
      { id: 456, name: 'secret-project', full_name: 'user/secret-project', private: true }
    ];
  }
}; 