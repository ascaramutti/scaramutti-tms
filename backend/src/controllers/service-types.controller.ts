import { Request, Response } from "express";
import { query } from "../config/db";
import { ServiceType } from "../interfaces/service-types/service-types.controller";
import { ErrorResponse } from "../interfaces/error/error.interface";
export const getServiceTypes =
    async (req: Request, res: Response<ServiceType[] | ErrorResponse>): Promise<void> => {
        try {
            const sql = `SELECT id, name, description FROM service_types 
                        WHERE is_active = true ORDER BY name ASC`;
            const result = await query<ServiceType>(sql);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error("Get Service Types Error:", error);
            res.status(500).json({ status: "ERROR", message: "Internal server error" });
        }
    };