import { ApiResponse, User, Company, Experience, Comment, Chat, ExperienceFilters, CompanyFilters, ExperienceFormData, LoginFormData, RegisterFormData } from '../types/api'

// API Configuration and Helper Functions
const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage (separate for admin and user)
const getAuthToken = (isAdmin: boolean = false): string | null => {
  if (typeof window !== 'undefined') {
    const key = isAdmin ? 'adminAccessToken' : 'accessToken';
    return localStorage.getItem(key);
  }
  return null;
};

// Get refresh token from localStorage
const getRefreshToken = (isAdmin: boolean = false): string | null => {
  if (typeof window !== 'undefined') {
    const key = isAdmin ? 'adminRefreshToken' : 'refreshToken';
    return localStorage.getItem(key);
  }
  return null;
};

// Save tokens to localStorage
const saveTokens = (accessToken: string, refreshToken?: string, isAdmin: boolean = false): void => {
  if (typeof window !== 'undefined') {
    const accessKey = isAdmin ? 'adminAccessToken' : 'accessToken';
    const refreshKey = isAdmin ? 'adminRefreshToken' : 'refreshToken';
    
    localStorage.setItem(accessKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(refreshKey, refreshToken);
    }
  }
};

// Remove tokens from localStorage
const removeTokens = (isAdmin: boolean = false): void => {
  if (typeof window !== 'undefined') {
    if (isAdmin) {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
};

// Save user data to localStorage
const saveUser = (user: User, isAdmin: boolean = false): void => {
  if (typeof window !== 'undefined') {
    const key = isAdmin ? 'adminUser' : 'user';
    localStorage.setItem(key, JSON.stringify(user));
  }
};

// Get user data from localStorage
const getUser = (isAdmin: boolean = false): User | null => {
  if (typeof window !== 'undefined') {
    const key = isAdmin ? 'adminUser' : 'user';
    const userData = localStorage.getItem(key);
    return userData ? JSON.parse(userData) : null;
  }
  return null;
};

// Check if user is authenticated
const isAuthenticated = (isAdmin: boolean = false): boolean => {
  return !!getAuthToken(isAdmin);
};

// Check if user is admin
const isAdmin = (): boolean => {
  const user = getUser(true);
  return user?.role === 'admin';
};

// Refresh access token
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      saveTokens(data.accessToken);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  removeTokens();
  return false;
};

// Generic API request function with auto token refresh
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse> => {
  // Detect if this is an admin endpoint
  const isAdminEndpoint = endpoint.startsWith('/admin');
  const token = getAuthToken(isAdminEndpoint);
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If token expired, try to refresh
    if (response.status === 401 && token) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = getAuthToken(isAdminEndpoint);
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      }
    }

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.errors || data.message || 'Request failed',
        message: data.message || 'Request failed'
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: 'Network error',
      message: 'Network error'
    };
  }
};

// Authentication API
export const authAPI = {
  login: async (credentials: LoginFormData): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      saveTokens(response.data.accessToken, response.data.refreshToken);
      saveUser(response.data.user);
    }

    return response;
  },

  register: async (userData: RegisterFormData): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      saveTokens(response.data.accessToken, response.data.refreshToken);
      saveUser(response.data.user);
    }

    return response;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await apiRequest('/auth/logout', {
      method: 'POST',
    });
    
    removeTokens();
    return response;
  },

  adminLogin: async (credentials: LoginFormData): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      // Check if user is admin
      if (response.data.user.role === 'admin') {
        saveTokens(response.data.accessToken, response.data.refreshToken, true);
        saveUser(response.data.user, true);
      } else {
        return {
          success: false,
          message: 'Access denied. Admin privileges required.',
          error: 'Not an admin'
        };
      }
    }

    return response;
  },

  adminLogout: async (): Promise<ApiResponse> => {
    removeTokens(true);
    return { success: true, message: 'Logged out successfully' };
  },
};

// Company API
export const companyAPI = {
  getCompanies: async (filters: CompanyFilters = {}): Promise<ApiResponse<{ companies: Company[]; total: number; page: number; totalPages: number }>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return apiRequest(`/companies?${params.toString()}`);
  },

  getCompanyBySlug: async (slug: string, filters: ExperienceFilters = {}): Promise<ApiResponse<{ company: Company; experiences: Experience[] }>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return apiRequest(`/companies/${slug}?${params.toString()}`);
  },

  createCompany: async (companyData: Partial<Company>): Promise<ApiResponse<Company>> => {
    return apiRequest('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  },
};

// Experience API
export const experienceAPI = {
  getExperiences: async (filters: ExperienceFilters = {}): Promise<ApiResponse<{ experiences: Experience[]; total: number; page: number; totalPages: number }>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return apiRequest(`/experiences?${params.toString()}`);
  },

  getExperience: async (id: string): Promise<ApiResponse<{ experience: Experience }>> => {
    return apiRequest(`/experiences/${id}`);
  },

  getExperienceById: async (id: string): Promise<ApiResponse<{ experience: Experience }>> => {
    return apiRequest(`/experiences/${id}`);
  },

  createExperience: async (experienceData: ExperienceFormData): Promise<ApiResponse<Experience>> => {
    return apiRequest('/experiences', {
      method: 'POST',
      body: JSON.stringify(experienceData),
    });
  },

  updateExperience: async (id: string, experienceData: any): Promise<ApiResponse<{ experience: any }>> => {
    return apiRequest(`/experiences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(experienceData),
    });
  },

  deleteExperience: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/experiences/${id}`, {
      method: 'DELETE',
    });
  },
};

// Comment API
export const commentAPI = {
  getComments: async (experienceId: string): Promise<ApiResponse<{ comments: Comment[]; pagination: any }>> => {
    return apiRequest(`/comments/${experienceId}`);
  },

  createComment: async (experienceId: string, commentData: { content: string }): Promise<ApiResponse<Comment>> => {
    return apiRequest(`/comments/${experienceId}`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },

  deleteComment: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/comments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Chat API
export const chatAPI = {
  getConversations: async (): Promise<ApiResponse<any>> => {
    return apiRequest('/chats');
  },

  startConversation: async (userId: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/chats/${userId}`, {
      method: 'POST',
    });
  },

  getMessages: async (conversationId: string, page: number = 1): Promise<ApiResponse<any>> => {
    return apiRequest(`/chats/${conversationId}/messages?page=${page}&limit=50`);
  },

  sendMessage: async (conversationId: string, content: string, fileData?: { messageType: string; fileUrl: string; fileName: string }): Promise<ApiResponse<any>> => {
    return apiRequest(`/chats/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ 
        content,
        message_type: fileData?.messageType || 'text',
        file_url: fileData?.fileUrl,
        file_name: fileData?.fileName
      }),
    });
  },

  markAsRead: async (conversationId: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/chats/${conversationId}/read`, {
      method: 'PUT',
    });
  },
};

// User API
export const userAPI = {
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiRequest('/users/profile');
  },

  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  getProfileStats: async (): Promise<ApiResponse<{
    postsPublished: number;
    commentsMade: number;
    totalViews: number;
  }>> => {
    return apiRequest('/users/profile/stats');
  },

  getProfileExperiences: async (): Promise<ApiResponse<{ experiences: Experience[] }>> => {
    return apiRequest('/users/profile/experiences');
  },

  getProfileComments: async (): Promise<ApiResponse<{ comments: Comment[] }>> => {
    return apiRequest('/users/profile/comments');
  },

  getUsers: async (filters: { page?: number; limit?: number; college?: string } = {}): Promise<ApiResponse<{ users: User[]; total: number }>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return apiRequest(`/users?${params.toString()}`);
  },

  getUserById: async (userId: string): Promise<ApiResponse<{ user: User; experiences: Experience[] }>> => {
    return apiRequest(`/users/${userId}`);
  },
};

// Admin API
export const adminAPI = {
  getDashboardStats: async (): Promise<ApiResponse<{
    totalUsers: number;
    totalExperiences: number;
    totalCompanies: number;
    pendingExperiences: number;
  }>> => {
    return apiRequest('/admin/dashboard');
  },

  getPendingExperiences: async (filters: { status?: string; page?: number; limit?: number } = {}): Promise<ApiResponse<{ experiences: Experience[]; pagination: any }>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    return apiRequest(`/admin/experiences?${params.toString()}`);
  },

  approveExperience: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/admin/experiences/${id}/approve`, {
      method: 'PUT',
    });
  },

  rejectExperience: async (id: string, reason: string): Promise<ApiResponse> => {
    return apiRequest(`/admin/experiences/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  deleteExperience: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/admin/experiences/${id}`, {
      method: 'DELETE',
    });
  },

  getExperienceById: async (id: string): Promise<ApiResponse<{ experience: Experience }>> => {
    return apiRequest(`/admin/experiences/${id}`);
  },
};

// Utility functions
export const utils = {
  getAuthToken,
  getRefreshToken,
  saveTokens,
  removeTokens,
  saveUser,
  getUser,
  isAuthenticated,
  isAdmin,
  refreshAccessToken,
};