import { ref, computed } from 'vue';
import { getProductList, getProductsForWheel, type Product } from '@/services/ProductService';

export function useProducts() {
    const products = ref<Product[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const hasError = computed(() => !!error.value);

    const loadProducts = async (): Promise<Product[]> => {
        loading.value = true;
        error.value = null;

        try {
            const productList = await getProductList();
            products.value = productList;
            return productList;
        } catch (err: any) {
            // If it's an authentication error, try to refresh token and retry once
            if (err.message === 'Authentication required' || err.response?.status === 403) {
                try {
                    // Import the refresh function dynamically to avoid circular dependencies
                    const { refreshToken } = await import('@/services/MosAuthService');
                    const refreshed = await refreshToken();

                    if (refreshed) {
                        const productList = await getProductList();
                        products.value = productList;
                        return productList;
                    }
                } catch (refreshError) {
                    console.error('Failed to refresh token:', refreshError);
                }
            }

            error.value = 'Failed to load products';
            console.error('Error loading products:', err);
            return [];
        } finally {
            loading.value = false;
        }
    };

    const loadProductsForWheel = async (): Promise<Product[]> => {
        loading.value = true;
        error.value = null;

        try {
            const wheelProducts = await getProductsForWheel();
            products.value = wheelProducts;
            return wheelProducts;
        } catch (err: any) {
            // If it's an authentication error, try to refresh token and retry once
            if (err.message === 'Authentication required' || err.response?.status === 403) {
                try {
                    // Import the refresh function dynamically to avoid circular dependencies
                    const { refreshToken } = await import('@/services/MosAuthService');
                    const refreshed = await refreshToken();

                    if (refreshed) {
                        const wheelProducts = await getProductsForWheel();
                        products.value = wheelProducts;
                        return wheelProducts;
                    }
                } catch (refreshError) {
                    console.error('Failed to refresh token:', refreshError);
                }
            }

            error.value = 'Failed to load wheel products';
            console.error('Error loading wheel products:', err);
            return [];
        } finally {
            loading.value = false;
        }
    };

    const clearError = () => {
        error.value = null;
    };

    const getProductById = (id: string | number): Product | undefined => {
        return products.value.find((product) => product.id.toString() === id.toString());
    };

    const productsCount = computed(() => products.value.length);

    const activeProducts = computed(() =>
        products.value.filter((product) => product.isActive !== false)
    );

    return {
        // State
        products,
        loading,
        error,
        hasError,

        // Computed
        productsCount,
        activeProducts,

        // Methods
        loadProducts,
        loadProductsForWheel,
        clearError,
        getProductById
    };
}
