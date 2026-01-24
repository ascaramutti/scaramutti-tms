import api from "./api";
import type { Client } from "../interfaces/clients.interface";

export const clientService = {
    getClients: async (): Promise<Client[]> => {
        const response = await api.get<Client[]>('/clients');
        return response.data;
    },

    searchClients: async(query: string): Promise<Client[]> => {
        const response = await api.get<Client[]>(`/clients?search=${query}`);
        return response.data;
    },

    createClient: async (client: Omit<Client, 'id' | 'created_at' | 'is_active'>): Promise<Client> => {
        const response = await api.post<Client>('/clients', client);
        return response.data;        
    }
};