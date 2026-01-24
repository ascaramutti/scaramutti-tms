import api from './api';
import type { Service, CreateServiceRequest } from '../interfaces/services.interface';
import type { AssignResourcesPayload } from '../interfaces/resources.interface';

export const servicesService = {
    getServices: async (filters?: { status?: string; date?: string; clientId?: number }): Promise<Service[]> => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.date) params.append('date', filters.date);
        if (filters?.clientId) params.append('clientId', filters.clientId.toString());

        const response = await api.get<Service[]>('/services', { params });
        return response.data;
    },
    createService: async (data: CreateServiceRequest): Promise<Service> => {
        const response = await api.post<Service>('/services', data);
        return response.data;
    },

    getServiceById: async (id: number): Promise<Service> => {
        const response = await api.get<Service>(`/services/${id}`);
        return response.data;
    },

    assignResources: async (serviceId: number, data: AssignResourcesPayload): Promise<Service> => {
        const response = await api.patch<Service>(`/services/${serviceId}/assign`, data);
        return response.data;
    }
};