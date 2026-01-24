import api from './api';
import type { Driver, Tractor, Trailer } from '../interfaces/resources.interface';
export const resourcesService = {
    getDrivers: async (): Promise<Driver[]> => {
        const response = await api.get<Driver[]>('/drivers');
        return response.data;
    },
    getTractors: async (): Promise<Tractor[]> => {
        const response = await api.get<Tractor[]>('/tractors');
        return response.data;
    },
    getTrailers: async (): Promise<Trailer[]> => {
        const response = await api.get<Trailer[]>('/trailers');
        return response.data;
    }
};