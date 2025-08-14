import apiClient from './api';
import type {
  ApiResponse,
  SpinResult,
  SpinHistory,
  SpinWheelConfig,
  CreateSpinRequest,
  UpdateWheelRequest,
  CreateWheelRequest,
  ApiError
} from '@/interface/IApi';

export class SpinWheelApiService {
  private static instance: SpinWheelApiService;
  private baseUrl = '/spin-wheel';

  private constructor() {}

  public static getInstance(): SpinWheelApiService {
    if (!SpinWheelApiService.instance) {
      SpinWheelApiService.instance = new SpinWheelApiService();
    }
    return SpinWheelApiService.instance;
  }

  // Get all spin wheel configurations
  async getSpinWheels(): Promise<ApiResponse<SpinWheelConfig[]>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/configs`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get a specific spin wheel configuration
  async getSpinWheel(wheelId: string): Promise<ApiResponse<SpinWheelConfig>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/configs/${wheelId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Create a new spin wheel configuration
  async createSpinWheel(config: CreateWheelRequest): Promise<ApiResponse<SpinWheelConfig>> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/configs`, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update a spin wheel configuration
  async updateSpinWheel(
    wheelId: string,
    updates: UpdateWheelRequest
  ): Promise<ApiResponse<SpinWheelConfig>> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/configs/${wheelId}`, updates);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Delete a spin wheel configuration
  async deleteSpinWheel(wheelId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/configs/${wheelId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Perform a spin
  async spin(request: CreateSpinRequest): Promise<ApiResponse<SpinResult>> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/spin`, request);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get spin history for a specific wheel
  async getSpinHistory(wheelId: string, limit: number = 50): Promise<ApiResponse<SpinHistory>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/history/${wheelId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get user's spin history
  async getUserSpinHistory(userId: string, limit: number = 50): Promise<ApiResponse<SpinResult[]>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/user-history/${userId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get statistics for a spin wheel
  async getSpinStatistics(wheelId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/statistics/${wheelId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Export spin history
  async exportSpinHistory(
    wheelId: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/export/${wheelId}`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      return {
        status: error.response.status,
        message: error.response.data?.message || 'API request failed',
        details: error.response.data
      };
    } else if (error.request) {
      return {
        status: 0,
        message: 'Network error - no response received',
        details: error.request
      };
    } else {
      return {
        status: 0,
        message: error.message || 'Unknown error occurred',
        details: error
      };
    }
  }
}

// Export singleton instance
export const spinWheelApi = SpinWheelApiService.getInstance();
