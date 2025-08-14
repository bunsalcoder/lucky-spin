import { ref, computed } from 'vue';
import { getHistory, type HistoryRecord } from '@/services/HistoryService';

export interface HistoryItem {
    no: string;
    date: string;
    win: string;
    chineseName?: string;
}

export function useHistory() {
    const historyRecords = ref<HistoryRecord[]>([]);
    const loading = ref<boolean>(false);
    const error = ref<string | null>(null);

    const loadHistory = async (): Promise<void> => {
        loading.value = true;
        error.value = null;

        try {
            const response = await getHistory();
            if (response.code === '200') {
                historyRecords.value = response.list;
            } else {
                error.value = response.message || 'Failed to load history';
            }
        } catch (err: any) {
            error.value = 'Failed to load history';
            console.error('Error loading history:', err);
        } finally {
            loading.value = false;
        }
    };

    const historyItems = computed<HistoryItem[]>(() => {
        return historyRecords.value.map((record, index) => {
            const date = new Date(record.createdTime);
            const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}.${String(
                date.getDate()
            ).padStart(2, '0')}.${String(date.getFullYear()).slice(-2)}`;

            const no = String(index + 1).padStart(2, '0');

            return {
                no,
                date: formattedDate,
                win: record.productEnName,
                chineseName: record.productZhName
            };
        });
    });

    const hasError = computed(() => !!error.value);

    return {
        // State
        historyRecords,
        historyItems,
        loading,
        error,
        hasError,

        // Methods
        loadHistory
    };
}
