import apiClient from './api';

export interface CoinResponse {
    code: string;
    message: string;
    data: {
        coin: number;
        enable: boolean;
    };
}

export const checkCoin = async (): Promise<CoinResponse> => {
    try {
        const response = await apiClient.get('/v1/api/user/checkCoin');
        return response.data;
    } catch (error) {
        console.error('Error checking coin:', error);
        throw error;
    }
};

export default {
    checkCoin
};
