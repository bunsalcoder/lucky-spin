import axios from 'axios';
import type {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig
} from 'axios';
import { refreshToken, clearToken } from './MosAuthService';

// API Configuration
const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
    headers: {
        'Content-Type': 'application/json'
    }
};

// Create axios instance
const apiClient: AxiosInstance = axios.create(API_CONFIG);

// Request interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('luckyWheelToken');
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add timestamp for caching prevention
        if (config.method === 'get' && config.params) {
            config.params = {
                ...config.params,
                _t: Date.now()
            };
        }

        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: any) => {
        // Handle 403 Forbidden - try to refresh token
        if (error.response && error.response.status === 403) {
            // Don't retry award API calls to prevent infinite loops
            if (error.config.url && error.config.url.includes('/lottery/award')) {
                console.error('Award API returned 403 - not retrying to prevent loops');
                return Promise.reject(error);
            }

            try {
                // Try to refresh the token
                const refreshed = await refreshToken();
                if (refreshed) {
                    // Add a small delay to ensure token is properly set
                    await new Promise((resolve) => setTimeout(resolve, 100));

                    // Retry the original request
                    const originalRequest = error.config;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Clear authentication data on refresh failure
                clearToken();
            }
        }

        // Handle other common errors
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    console.error('Unauthorized access');
                    break;
                case 404:
                    console.error('Resource not found');
                    break;
                case 500:
                    console.error('Internal server error');
                    break;
                default:
                    console.error(`API Error: ${error.response.status}`, error.response.data);
            }
        } else if (error.request) {
            console.error('Network error - no response received');
        } else {
            console.error('Request setup error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
