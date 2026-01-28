import api from './api';
import type { Service, CreateServiceRequest, ChangeStatusPayload, AssignResourcesPayload } from '../interfaces/services.interface';

export const servicesService = {
    getServices: async (filters?: { status?: string; date?: string; clientId?: number; search?: string; limit?: number; offset?: number; sort?: 'recent' }): Promise<Service[]> => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.date) params.append('date', filters.date);
        if (filters?.clientId) params.append('clientId', filters.clientId.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset !== undefined) params.append('offset', filters.offset.toString());
        if (filters?.sort) params.append('sort', filters.sort);

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
    },

    changeStatus: async (serviceId: number, data: ChangeStatusPayload): Promise<Service> => {
        const response = await api.patch<Service>(`/services/${serviceId}/status`, data);
        return response.data;
    }
};