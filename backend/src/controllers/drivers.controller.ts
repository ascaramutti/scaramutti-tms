import { Request, Response } from "express";
import { query } from "../config/db";
import { Driver } from "../interfaces/drivers/driver.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";

export const getDrivers = async (req: Request, res: Response<Driver[] | ErrorResponse>): Promise<void> => {
    const { status } = req.query;

    try {

        let sql =`
            SELECT
                d.id,
                w.first_name || ' ' || w.last_name as name,
                w.phone,
                d.license_number,
                rs.name as status,
                d.is_active
            FROM drivers d
            JOIN workers w ON d.worker_id = w.id
            LEFT JOIN resource_statuses rs ON d.status_id = rs.id
            WHERE d.is_active = true
        `;

        const params: any[] = [];

        if (status) {
            sql += ` AND rs.name = $1`;
            params.push(status);
        }

        sql += ` ORDER BY w.last_name ASC`;

        const result = await query<Driver>(sql, params);
        res.status(200).json(result.rows);

    } catch (error: unknown) {
        console.error(`Get Drivers ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};