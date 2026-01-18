import { Request, Response } from "express";
import { query } from "../config/db";
import { ErrorResponse } from "../interfaces/error/error.interface";
import { DashboardStats } from "../interfaces/dashboard/dashboard.interface";

export const getDashboardStats = async (req: Request, res: Response<DashboardStats | ErrorResponse>): Promise<void> => {
    try {
        const now = new Date();

        const peruDateString = now.toLocaleDateString("en-CA", { timeZone: "America/Lima" });
        const [py, pm, pd] = peruDateString.split('-').map(Number);
        const peruAnchor = new Date(py || 2023, (pm || 1) - 1, pd || 1);
        const currentDay = peruAnchor.getDay(); 

        const daysSinceWednesday = (currentDay + 7 - 3) % 7;

        const lastWednesday = new Date(peruAnchor);
        lastWednesday.setDate(peruAnchor.getDate() - daysSinceWednesday);
        lastWednesday.setHours(0, 0, 0, 0);

        const nextTuesday = new Date(lastWednesday);
        nextTuesday.setDate(lastWednesday.getDate() + 6);
        nextTuesday.setHours(23, 59, 59, 999);
        const statusCountsPromise = query<{ name: string, count: string }>(`
            SELECT ss.name, COUNT(s.id) 
            FROM services s
            JOIN service_statuses ss ON s.status_id = ss.id
            WHERE ss.name IN ('pending_assignment', 'pending_start', 'in_progress')
            GROUP BY ss.name
        `);

        const resourcesPromise = query<{ type: string, count: string }>(`
            SELECT 'drivers_active' as type, COUNT(DISTINCT driver_id) as count FROM services s JOIN service_statuses ss ON s.status_id = ss.id WHERE ss.name = 'in_progress'
            UNION ALL
            SELECT 'tractors_active' as type, COUNT(DISTINCT tractor_id) as count FROM services s JOIN service_statuses ss ON s.status_id = ss.id WHERE ss.name = 'in_progress'
            UNION ALL
            SELECT 'drivers_total' as type, COUNT(id) as count FROM drivers WHERE is_active = true
            UNION ALL
            SELECT 'tractors_total' as type, COUNT(id) as count FROM tractors WHERE is_active = true
        `);

        const completedWeekPromise = query<{ count: string }>(`
            SELECT COUNT(s.id) as count
            FROM services s
            JOIN service_statuses ss ON s.status_id = ss.id
            WHERE ss.name = 'completed'
            AND s.end_date_time >= $1 AND s.end_date_time <= $2
        `, [lastWednesday, nextTuesday]);

        const [statusRes, resourcesRes, completedRes] = await Promise.all([
            statusCountsPromise,
            resourcesPromise,
            completedWeekPromise
        ]);

        const stats: DashboardStats = {
            services: {
                pending_assignment: 0,
                pending_start: 0,
                in_progress: 0,
                completed_week: parseInt(completedRes.rows[0]?.count || '0', 10)
            },
            resources_on_road: {
                drivers_active: 0,
                drivers_total: 0,
                tractors_active: 0,
                tractors_total: 0
            },
            week_cycle: {
                start: lastWednesday,
                end: nextTuesday
            }
        };

        statusRes.rows.forEach(row => {
            if (row.name === 'pending_assignment') stats.services.pending_assignment = parseInt(row.count, 10);
            if (row.name === 'pending_start') stats.services.pending_start = parseInt(row.count, 10);
            if (row.name === 'in_progress') stats.services.in_progress = parseInt(row.count, 10);
        });

        resourcesRes.rows.forEach(row => {
            if (row.type === 'drivers_active') stats.resources_on_road.drivers_active = parseInt(row.count, 10);
            if (row.type === 'tractors_active') stats.resources_on_road.tractors_active = parseInt(row.count, 10);
            if (row.type === 'drivers_total') stats.resources_on_road.drivers_total = parseInt(row.count, 10);
            if (row.type === 'tractors_total') stats.resources_on_road.tractors_total = parseInt(row.count, 10);
        });

        res.status(200).json(stats);

    } catch (error) {
        console.error(`Dashboard Stats Error: ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};
