import api from "./api";
import type { DashboardStats } from "../interfaces/dashboard.interface";

export const dashboardService = {
    getStats: async(): Promise<DashboardStats> => {
        const response = await api.get<DashboardStats>('/dashboard/stats');
        return response.data;
    },
};