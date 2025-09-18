// API Client for Slack Competitor
// Handles all HTTP requests to the backend with proper error handling and retries

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  statusMessage?: string;
  emailVerified: boolean;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  ownerId: number;
  isPublic: boolean;
  role?: 'owner' | 'admin' | 'member';
  joinedAt?: string;
  customTitle?: string;
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  role: 'owner' | 'admin' | 'member';
  customTitle?: string;
  joinedAt: string;
}

export interface Channel {
  id: number;
  workspaceId: number;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'private';
  isPrivate: boolean;
  topic?: string;
  memberCount: number;
  isMember?: boolean;
  joinedAt?: string;
  members?: ChannelMember[];
}

export interface ChannelMember {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  canPost: boolean;
  joinedAt: string;
}

export interface Message {
  id: number;
  channelId: number;
  userId: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: Record<string, unknown>[];
  threadId?: number;
  editedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    displayName: string;
    avatar?: string;
  };
  reactions?: Record<string, {
    emoji: Emoji;
    users: { id: number; username: string; displayName: string }[];
    count: number;
  }>;
}

export interface Emoji {
  id: number;
  workspaceId?: number;
  name: string;
  shortcode: string;
  imageUrl?: string;
  isCustom: boolean;
  usageCount: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T = Record<string, unknown>>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/api/auth/logout', {
      method: 'POST',
    });
    
    this.clearToken();
    return response;
  }

  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  async updateProfile(data: {
    displayName?: string;
    avatar?: string;
    statusMessage?: string;
  }): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): Promise<ApiResponse> {
    return this.request('/api/users/presence', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ============================================================================
  // WORKSPACE ENDPOINTS
  // ============================================================================

  async getWorkspaces(): Promise<ApiResponse<{ workspaces: Workspace[] }>> {
    return this.request<{ workspaces: Workspace[] }>('/api/workspaces');
  }

  async getWorkspace(id: number): Promise<ApiResponse<{ workspace: Workspace }>> {
    return this.request<{ workspace: Workspace }>(`/api/workspaces/${id}`);
  }

  async createWorkspace(data: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<ApiResponse<{ workspace: Workspace }>> {
    return this.request<{ workspace: Workspace }>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // CHANNEL ENDPOINTS
  // ============================================================================

  async getWorkspaceChannels(workspaceId: number): Promise<ApiResponse<{ channels: Channel[] }>> {
    return this.request<{ channels: Channel[] }>(`/api/channels/workspace/${workspaceId}`);
  }

  async getChannel(id: number): Promise<ApiResponse<{ channel: Channel }>> {
    return this.request<{ channel: Channel }>(`/api/channels/${id}`);
  }

  async joinChannel(id: number): Promise<ApiResponse> {
    return this.request(`/api/channels/${id}/join`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // MESSAGE ENDPOINTS
  // ============================================================================

  async getChannelMessages(
    channelId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<ApiResponse<{ messages: Message[]; hasMore: boolean }>> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const queryString = params.toString();
    const endpoint = `/api/messages/channel/${channelId}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ messages: Message[]; hasMore: boolean }>(endpoint);
  }

  async sendMessage(data: {
    channelId: number;
    content: string;
    type?: 'text' | 'image' | 'file';
    threadId?: number;
  }): Promise<ApiResponse<{ message: Message }>> {
    return this.request<{ message: Message }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleReaction(messageId: number, emojiId: number): Promise<ApiResponse> {
    return this.request(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emojiId }),
    });
  }

  // ============================================================================
  // EMOJI ENDPOINTS
  // ============================================================================

  async getWorkspaceEmojis(workspaceId: number): Promise<ApiResponse<{ 
    emojis: { default: Emoji[]; custom: Emoji[] };
    total: number;
  }>> {
    return this.request<{ 
      emojis: { default: Emoji[]; custom: Emoji[] };
      total: number;
    }>(`/api/emojis/workspace/${workspaceId}`);
  }

  async searchEmojis(query: string, workspaceId?: number): Promise<ApiResponse<{ emojis: Emoji[] }>> {
    const params = new URLSearchParams({ q: query });
    if (workspaceId) params.append('workspaceId', workspaceId.toString());
    
    return this.request<{ emojis: Emoji[] }>(`/api/emojis/search?${params}`);
  }

  async useEmoji(emojiId: number): Promise<ApiResponse> {
    return this.request(`/api/emojis/${emojiId}/use`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    version: string;
    environment: string;
  }>> {
    return this.request<{
      status: string;
      timestamp: string;
      version: string;
      environment: string;
    }>('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
