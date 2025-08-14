import apiClient from './api';

export interface AwardResponse {
    code: string;
    message: string;
    data: {
        id: number;
        createdTime: string | null;
        createdBy: string | null;
        updatedTime: string | null;
        updatedBy: string | null;
        productEnName: string;
        productZhName: string;
        imgUrl: string;
    };
}

export const getAward = async (): Promise<AwardResponse> => {
    try {
        const response = await apiClient.get('/v1/api/lottery/award');
        return response.data;
    } catch (error) {
        console.error('Error getting award:', error);
        throw error;
    }
};

export default {
    getAward
};
