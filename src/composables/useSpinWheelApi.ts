import { ref, computed } from 'vue';
import { spinWheelApi } from '@/services/SpinWheelApiService';
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

export function useSpinWheelApi() {
  const loading = ref(false);
  const error = ref<ApiError | null>(null);
  const lastResult = ref<ApiResponse<any> | null>(null);

  // Computed properties
  const hasError = computed(() => error.value !== null);
  const errorMessage = computed(() => error.value?.message || '');
  const isLoading = computed(() => loading.value);

  // Helper function to handle API calls
  const executeApiCall = async <T>(
    apiCall: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T> | null> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await apiCall();
      lastResult.value = result;
      return result;
    } catch (err: any) {
      error.value = err;
      console.error('API Error:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // API methods
  const getSpinWheels = async () => {
    return await executeApiCall(() => spinWheelApi.getSpinWheels());
  };

  const getSpinWheel = async (wheelId: string) => {
    return await executeApiCall(() => spinWheelApi.getSpinWheel(wheelId));
  };

  const createSpinWheel = async (config: CreateWheelRequest) => {
    return await executeApiCall(() => spinWheelApi.createSpinWheel(config));
  };

  const updateSpinWheel = async (wheelId: string, updates: UpdateWheelRequest) => {
    return await executeApiCall(() => spinWheelApi.updateSpinWheel(wheelId, updates));
  };

  const deleteSpinWheel = async (wheelId: string) => {
    return await executeApiCall(() => spinWheelApi.deleteSpinWheel(wheelId));
  };

  const spin = async (request: CreateSpinRequest) => {
    return await executeApiCall(() => spinWheelApi.spin(request));
  };

  const getSpinHistory = async (wheelId: string, limit: number = 50) => {
    return await executeApiCall(() => spinWheelApi.getSpinHistory(wheelId, limit));
  };

  const getUserSpinHistory = async (userId: string, limit: number = 50) => {
    return await executeApiCall(() => spinWheelApi.getUserSpinHistory(userId, limit));
  };

  const getSpinStatistics = async (wheelId: string) => {
    return await executeApiCall(() => spinWheelApi.getSpinStatistics(wheelId));
  };

  const exportSpinHistory = async (wheelId: string, format: 'csv' | 'json' = 'csv') => {
    return await executeApiCall(() => spinWheelApi.exportSpinHistory(wheelId, format));
  };

  const healthCheck = async () => {
    return await executeApiCall(() => spinWheelApi.healthCheck());
  };

  // Clear error
  const clearError = () => {
    error.value = null;
  };

  // Clear last result
  const clearResult = () => {
    lastResult.value = null;
  };

  return {
    // State
    loading,
    error,
    lastResult,

    // Computed
    hasError,
    errorMessage,
    isLoading,

    // Methods
    getSpinWheels,
    getSpinWheel,
    createSpinWheel,
    updateSpinWheel,
    deleteSpinWheel,
    spin,
    getSpinHistory,
    getUserSpinHistory,
    getSpinStatistics,
    exportSpinHistory,
    healthCheck,
    clearError,
    clearResult
  };
}
