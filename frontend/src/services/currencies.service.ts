import api from './api';
import type { Currency } from '../interfaces/currencies.interface';

export const currenciesService = {
    getCurrencies: async (): Promise<Currency[]> => {
        const response = await api.get<Currency[]>('/currencies');
        return response.data;
    }
};