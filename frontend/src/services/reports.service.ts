import api from './api';
import type { WeeklyTripsResponse } from '../interfaces/reports.interface';

/**
 * US-001: Weekly Trips Report Service
 */
class ReportsService {
    /**
     * Get weekly trips report
     * @param offset - Week offset (0 = current week, -1 = previous week, etc.)
     * @returns Weekly trips data
     */
    async getWeeklyTrips(offset: number = 0): Promise<WeeklyTripsResponse> {
        const response = await api.get<WeeklyTripsResponse>(`/reports/weekly-trips?offset=${offset}`);
        return response.data;
    }

    /**
     * Export weekly trips to Excel
     * @param offset - Week offset (0 = current week, -1 = previous week, etc.)
     * @returns Blob for download
     */
    async exportWeeklyTrips(offset: number): Promise<Blob> {
        const response = await api.get(`/reports/weekly-trips/export?offset=${offset}`, {
            responseType: 'blob'
        });
        return response.data;
    }

    /**
     * Download Excel file
     * @param offset - Week offset
     * @param filename - Optional filename
     */
    async downloadWeeklyTripsExcel(offset: number, filename?: string): Promise<void> {
        const blob = await this.exportWeeklyTrips(offset);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `reporte_viajes_semana_${offset}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

export const reportsService = new ReportsService();
