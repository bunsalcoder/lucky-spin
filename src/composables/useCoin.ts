import { ref, computed } from 'vue';
import { checkCoin, type CoinResponse } from '@/services/CoinService';

export function useCoin() {
    const coin = ref<number>(0);
    const enable = ref<boolean>(false);
    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);

    const loadCoin = async (): Promise<void> => {
        loading.value = true;
        error.value = null;

        try {
            const response = await checkCoin();
            if (response.code === '200') {
                coin.value = response.data.coin;
                enable.value = response.data.enable;
            } else {
                error.value = response.message || 'Failed to load coin';
            }
        } catch (err: any) {
            error.value = 'Failed to load coin';
            console.error('Error loading coin:', err);
        } finally {
            loading.value = false;
        }
    };

    const hasError = computed(() => !!error.value);

    return {
        // State
        coin,
        enable,
        loading,
        error,
        hasError,

        // Methods
        loadCoin
    };
}
