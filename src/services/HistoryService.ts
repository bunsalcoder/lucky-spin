import apiClient from './api';

export interface HistoryRecord {
    id: number;
    createdTime: string;
    createdBy: string;
    updatedTime: string;
    updatedBy: string;
    productId: number;
    productEnName: string;
    productZhName: string;
    productUrl: string;
    count: number;
    status: number;
}

export interface HistoryResponse {
    code: string;
    message: string;
    list: HistoryRecord[];
}

export const getHistory = async (): Promise<HistoryResponse> => {
    try {
        const response = await apiClient.get('/v1/api/lottery/record');
        return response.data;
    } catch (error) {
        console.error('Error fetching history:', error);
        throw error;
    }
};

export default {
    getHistory
};
