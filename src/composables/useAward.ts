import { ref, computed } from 'vue';
import { getAward, type AwardResponse } from '@/services/AwardService';

export function useAward() {
    const award = ref<AwardResponse['data'] | null>(null);
    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);
    const isRequesting = ref<boolean>(false);

    const requestAward = async (): Promise<AwardResponse['data'] | null> => {
        // Prevent multiple simultaneous requests
        if (isRequesting.value) {
            console.log('Award request already in progress, skipping...');
            return null;
        }

        isRequesting.value = true;
        loading.value = true;
        error.value = null;

        try {
            const response = await getAward();
            if (response.code === '200') {
                award.value = response.data;
                return response.data;
            } else if (response.code === '1000') {
                error.value = 'Out of stock';
                return null;
            } else {
                error.value = response.message || 'Failed to get award';
                return null;
            }
        } catch (err: any) {
            error.value = 'Failed to get award';
            console.error('Error getting award:', err);
            return null;
        } finally {
            loading.value = false;
            isRequesting.value = false;
        }
    };

    const clearAward = () => {
        award.value = null;
        error.value = null;
        isRequesting.value = false;
    };

    const hasError = computed(() => !!error.value);

    return {
        // State
        award,
        loading,
        error,
        hasError,

        // Methods
        requestAward,
        clearAward
    };
}
