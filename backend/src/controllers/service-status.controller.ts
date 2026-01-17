import { Request, Response } from "express";
import { query } from "../config/db";
import { ServiceStatus } from "../interfaces/service-status/service-status.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";

export const getServiceStatuses = async (req: Request, res: Response<ServiceStatus[] | ErrorResponse>): Promise<void> => {
    try {
        const sql = `
            SELECT id, name, description
            FROM service_statuses
            ORDER BY id ASC
        `;

        const result = await query<ServiceStatus>(sql);
        res.status(200).json(result.rows);
        
    } catch (error: unknown) {
        console.error(`Get Service Statuses ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server Error' });
    }
}