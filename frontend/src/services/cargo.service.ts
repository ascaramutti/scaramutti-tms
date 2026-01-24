import api from "./api";
import type { CargoType } from "../interfaces/cargo.interface";

export const cargoService = {
    getCargoTypes: async(): Promise<CargoType[]> => {
        const response = await api.get<CargoType[]>('/cargo-types');
        return response.data;
    },

    searchCargoTypes: async (query: string): Promise<CargoType[]> => {
        const response = await api.get<CargoType[]>(`/cargo-types?search=${query}`);
        return response.data;
    },
    createCargoType: async (cargo: Omit<CargoType, 'id' | 'created_at' | 'is_active'>): Promise<CargoType> => {
        const payload ={
            name: cargo.name,
            description: cargo.description,
            standardWeight: cargo.standard_weight,
            standardLength: cargo.standard_length,
            standardWidth: cargo.standard_width,
            standardHeight: cargo.standard_height
        };
        const response = await api.post<CargoType>('/cargo-types', payload);
        return response.data;
    }
};