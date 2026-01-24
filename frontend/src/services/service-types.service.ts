import api from "./api";
import type { ServiceType } from "../interfaces/service-types.interface";

export const serviceTypesService = {
    getServiceTypes: async(): Promise<ServiceType[]> => {
        const response = await api.get<ServiceType[]>('/service-types');
        return response.data;
    }
};