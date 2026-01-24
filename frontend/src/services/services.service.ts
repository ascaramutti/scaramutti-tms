import api from './api';
import type { Service, CreateServiceRequest } from '../interfaces/services.interface';

export const servicesService = {
    getServices: async (): Promise<Service[]> => {
        const response = await api.get<Service[]>('/services');
        return response.data;
    },
    createService: async (data: CreateServiceRequest): Promise<Service> => {
        const response = await api.post<Service>('/services', data);
        return response.data;
    },
    
    getServiceById: async (id: number): Promise<Service> => {
        const response = await api.get<Service>(`/services/${id}`);
        return response.data;
    }
};