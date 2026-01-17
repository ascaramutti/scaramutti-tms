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
        if (!clientId || !origin || !destination || !tentativeDate || !cargoTypeId || !weight || !price || !currencyId) {
            res.status(400).json({ status: 'ERROR', message: 'Missing required fields' });
            return;
        }

        const statusSql = `SELECT id FROM service_statuses WHERE name = 'pending_assignment'` // pero si tengo un endpoint para esto
        const statusResult = await query<{ id: number }>(statusSql);
        const pendingStatusId = statusResult.rows[0]?.id;

        if (!pendingStatusId) {
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

export const getServices = async (req: Request, res: Response<Service[] | ErrorResponse>): Promise<void> => {
    const { status, clientId, date } = req.query;

    try {
        let sql = `
            SELECT 
                s.id,
                s.client_id, c.name as client_name,
                s.origin, s.destination, s.tentative_date,
                s.cargo_type_id, ct.name as cargo_type_name,
                s.weight, s.length, s.width, s.height, s.observations,
                s.price,
                s.currency_id, cur.code as currency_code,
                
                s.driver_id, (w.first_name || ' ' || w.last_name) as driver_name,
                s.tractor_id, tr.plate as tractor_plate,
                s.trailer_id, tl.plate as trailer_plate,
                
                s.status_id, ss.name as status_name
            FROM services s
            JOIN clients c ON s.client_id = c.id
            JOIN cargo_types ct ON s.cargo_type_id = ct.id
            JOIN currencies cur ON s.currency_id = cur.id
            JOIN service_statuses ss ON s.status_id = ss.id
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN workers w ON d.worker_id = w.id
            LEFT JOIN tractors tr ON s.tractor_id = tr.id
            LEFT JOIN trailers tl ON s.trailer_id = tl.id
            
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            sql += ` AND ss.name = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (clientId) {
            sql += ` AND s.client_id = $${paramIndex}`;
            params.push(clientId);
            paramIndex++;
        }
        if (date) {
            sql += ` AND s.tentative_date = $${paramIndex}`;
            params.push(date);
            paramIndex++;
        }

        sql += ` ORDER BY s.created_at DESC`;
        const result = await query<Service>(sql, params);
        const userRole = (req as AuthenticatedRequest).user?.role;
        const financialRoles = ['admin', 'general_manager', 'sales', 'operations_manager'];
        const services: Service[] = result.rows.map(service => {
            if (!financialRoles.includes(userRole || '')) {
                const { price, currency_id, currency_code, ...safeService} = service;
                return safeService;
            }
            return service;
        });      
        res.status(200).json(services);
    } catch (error: unknown) {
        console.error(`Get Services Error: ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};