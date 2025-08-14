# API Integration Guide

This document explains how to set up and use the API integration for the Lucky Spin Wheel application.

## Setup

### 1. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=10000

# Environment
VITE_NODE_ENV=development

# Optional: API Authentication
VITE_API_KEY=your_api_key_here
VITE_API_SECRET=your_api_secret_here

# MOS Authentication
VITE_MOS_APP_KEY=your_mos_app_key_here
```

### 2. Install Dependencies

The API integration requires axios for HTTP requests:

```bash
npm install axios
```

### 3. MOS SDK Integration

The MOS SDK is automatically loaded from the CDN in `index.html`:

```html
<script src="https://cdn-oss.mos.me/public/js/mos-1.1.0.js"></script>
```

The MOS authentication is automatically initialized when the application starts.

## API Structure

### Base Configuration

-   **Base URL**: Configured via `VITE_API_BASE_URL` environment variable
-   **Timeout**: Configured via `VITE_API_TIMEOUT` environment variable (default: 10 seconds)
-   **Authentication**: Bearer token authentication using `VITE_API_KEY`

### API Endpoints

The API service provides the following endpoints:

#### Spin Wheel Configuration

-   `GET /spin-wheel/configs` - Get all spin wheel configurations
-   `GET /spin-wheel/configs/:id` - Get specific spin wheel configuration
-   `POST /spin-wheel/configs` - Create new spin wheel configuration
-   `PUT /spin-wheel/configs/:id` - Update spin wheel configuration
-   `DELETE /spin-wheel/configs/:id` - Delete spin wheel configuration

#### Spin Operations

-   `POST /spin-wheel/spin` - Perform a spin
-   `GET /spin-wheel/history/:wheelId` - Get spin history for a wheel
-   `GET /spin-wheel/user-history/:userId` - Get user's spin history
-   `GET /spin-wheel/statistics/:wheelId` - Get spin statistics

#### Utility

-   `GET /spin-wheel/health` - Health check
-   `GET /spin-wheel/export/:wheelId` - Export spin history

#### Authentication

-   `POST /auth/miniAppLogin` - MOS mini app login verification
-   `POST /auth/loginWithOpenId` - OpenID login verification

#### Products

-   `GET /v1/api/product/list` - Get product list for lucky wheel

## Usage

### 1. MOS Authentication

The MOS authentication is automatically handled by the `MosAuthService`. The service:

1. Initializes MOS login with your app key
2. Sends the received code to your backend for verification
3. Stores the returned token in localStorage
4. Automatically includes the token in API requests

```typescript
import {
    isAuthenticated,
    getToken,
    getOpenId,
    getUsername,
    initializeLogin,
    clearToken
} from '@/services/MosAuthService';

// Check authentication status
const authenticated = isAuthenticated();

// Get the stored token
const token = getToken();

// Get OpenID and username
const openId = getOpenId();
const username = getUsername();

// Manually initialize authentication (usually done automatically)
await initializeLogin();

// Clear the stored token
clearToken();
```

### 3. Using the Product Service

```typescript
import { useProducts } from '@/composables/useProducts';

const { products, loading, error, loadProducts, loadProductsForWheel } = useProducts();

// Load all products
await loadProducts();

// Load products specifically for wheel (filtered and limited)
await loadProductsForWheel();

// Access products
console.log('Products:', products.value);
```

### 4. Authentication Flow

The application follows this authentication flow:

1. **Page Load**: Initialize MOS authentication
2. **MOS Login**: Get code and user info from MOS SDK
3. **Backend Login**: Send code to `/auth/miniAppLogin`
4. **Token Storage**: Store token and OpenID
5. **Product Loading**: Load products only after successful authentication
6. **Token Refresh**: Automatically refresh token on 403 errors

```typescript
import { initializeLogin, refreshToken } from '@/services/MosAuthService';

// Initialize complete authentication flow
await initializeLogin();

// Manual token refresh (handled automatically by API interceptor)
const refreshed = await refreshToken();
```

### 2. Using the API Service Directly

```typescript
import { spinWheelApi } from '@/services/SpinWheelApiService';

// Get all spin wheels
const wheels = await spinWheelApi.getSpinWheels();

// Perform a spin
const result = await spinWheelApi.spin({
    wheelId: 'wheel-123',
    userId: 'user-456'
});
```

### 2. Using the Vue Composable

```vue
<script setup lang="ts">
import { useSpinWheelApi } from '@/composables/useSpinWheelApi';

const { loading, error, hasError, errorMessage, spin, getSpinWheels } = useSpinWheelApi();

// Load spin wheels
const loadWheels = async () => {
    const result = await getSpinWheels();
    if (result?.success) {
        console.log('Wheels loaded:', result.data);
    }
};

// Perform a spin
const performSpin = async () => {
    const result = await spin({
        wheelId: 'wheel-123',
        userId: 'user-456'
    });

    if (result?.success) {
        console.log('Spin result:', result.data);
    }
};
</script>

<template>
    <div>
        <div v-if="loading">Loading...</div>
        <div v-if="hasError" class="error">{{ errorMessage }}</div>
        <button @click="performSpin" :disabled="loading">Spin the Wheel</button>
    </div>
</template>
```

## Data Types

### SpinWheelConfig

```typescript
interface SpinWheelConfig {
    id: string;
    name: string;
    items: SpinWheelItem[];
    settings: SpinWheelSettings;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
```

### SpinResult

```typescript
interface SpinResult {
    id: string;
    itemId: string;
    itemName: string;
    itemColor: string;
    timestamp: string;
    userId?: string;
}
```

### ApiResponse

```typescript
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
```

## Error Handling

The API service includes comprehensive error handling:

-   **Network errors**: Handled automatically with user-friendly messages
-   **HTTP status errors**: 401, 403, 404, 500 errors are logged and handled
-   **Request timeouts**: Configured via environment variable
-   **Authentication errors**: Automatic retry with proper error messages

## Development

### Adding New Endpoints

1. Add the endpoint method to `SpinWheelApiService`
2. Add corresponding types to `IApi.ts`
3. Add the method to the composable `useSpinWheelApi`
4. Update this documentation

### Testing

The API service can be tested by:

1. Setting up a mock API server
2. Using the health check endpoint
3. Testing with real API endpoints

## Security Considerations

-   API keys are stored in environment variables
-   All requests include authentication headers when API key is provided
-   HTTPS is recommended for production
-   CORS should be properly configured on the backend

## Production Deployment

For production deployment:

1. Set `VITE_NODE_ENV=production`
2. Configure proper API base URL
3. Set up API authentication keys
4. Ensure HTTPS is used
5. Configure proper CORS settings on the backend
