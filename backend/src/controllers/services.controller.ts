import { Request, Response } from "express";
import { query } from "../config/db";
import { Service, CreateServiceRequest } from "../interfaces/services/service.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";
import { AuthenticatedRequest } from "../interfaces/auth/auth.interface";

export const createService = async (req: Request<{}, {}, CreateServiceRequest>, res: Response<Service | ErrorResponse>): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const {
        clientId, origin, destination, tentativeDate, cargoTypeId, weight, length, width, height, observations, price, currencyId
    } = req.body;

    try {
        if(!clientId || !origin || !destination || !tentativeDate || !cargoTypeId || !weight || !price || !currencyId) {
            res.status(400).json({ status: 'ERROR', message: 'Missing required fields' });
            return;
        }

        const statusSql = `SELECT id FROM service_statuses WHERE name = 'pending_assignment'` // pero si tengo un endpoint para esto
        const statusResult = await query<{id: number}>(statusSql);
        const pendingStatusId = statusResult.rows[0]?.id;

        if(!pendingStatusId) {
            res.status(500).json({ status: 'ERROR', message: 'Initial status configuration missing' });
            return;
        }

        const sql = `
            INSERT INTO services (
                client_id, origin, destination, tentative_date,
                cargo_type_id, weight, length, width, height, observations,
                price, currency_id,
                status_id, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const values = [
            clientId, origin, destination, tentativeDate, 
            cargoTypeId, weight, length || null, width || null, height || null, observations || null,
            price, currencyId,
            pendingStatusId, userId 
        ];

        const result = await query<Service>(sql, values);
        const newService = result.rows[0];

        res.status(201).json(newService);

    } catch (error: any) {
        console.error(`Create Service ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};