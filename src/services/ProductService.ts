import apiClient from './api';

export interface Product {
    id: number;
    createdTime?: string | null;
    createdBy?: string | null;
    updatedTime?: string | null;
    updatedBy?: string | null;
    enName: string; // English name
    zhName: string; // Chinese name
    productUrl: string; // Image URL
    // Legacy fields for compatibility
    name?: string;
    image?: string;
    label?: string;
    description?: string;
    price?: number;
    category?: string;
    isActive?: boolean;
}

export interface ProductListResponse {
    success: boolean;
    data: Product[];
    total?: number;
    page?: number;
    limit?: number;
}

export const getProductList = async (): Promise<Product[]> => {
    try {
        // Verify token is available before making the request
        const token = localStorage.getItem('luckyWheelToken');
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await apiClient.get('/v1/api/product/list');

        if (response && response.data && response.status === 200) {
            // The API returns data directly in response.data
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                // Fallback for nested data structure
                return response.data.data;
            } else {
                return [];
            }
        }

        return [];
    } catch (error) {
        console.error('Error fetching product list:', error);
        return [];
    }
};

export const getProductsForWheel = async (): Promise<Product[]> => {
    const products = await getProductList();

    // Map API response to expected format and filter
    const mappedProducts = products.map((product) => ({
        ...product,
        name: product.enName,
        label: product.zhName,
        chineseLabel: product.zhName, // For SpinWheel component
        image: product.productUrl,
        isActive: true // All products from API are considered active
    }));

    const filteredProducts = mappedProducts.slice(0, 12);
    return filteredProducts;
};

export default {
    getProductList,
    getProductsForWheel
};
