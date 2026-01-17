import { Request, Response } from "express";
import { query } from "../config/db";
import { Service, CreateServiceRequest, AssignResourcesRequest } from "../interfaces/services/service.interface";
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

        await query('BEGIN');

        const statusSql = `SELECT id FROM service_statuses WHERE name = 'pending_assignment'`
        const statusResult = await query<{ id: number }>(statusSql);
        const pendingStatusId = statusResult.rows[0]?.id;

        if (!pendingStatusId) {
            await query('ROLLBACK');
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

        const logSql = `
            INSERT INTO service_audit_logs (service_id, changed_by, change_type, description, new_status)
            VALUES ($1, $2, 'CREATED', 'Service created', 'pending_assigment')
        `;
        await query(logSql, [newService!.id, userId]);

        await query('COMMIT');
        res.status(201).json(newService);

    } catch (error: any) {
        await query('ROLLBACK');
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
                s.operational_notes,
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
                const { price, currency_id, currency_code, ...safeService } = service;
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

export const getServiceById = async (req: Request, res: Response<Service | ErrorResponse>): Promise<void> => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT 
                s.id,
                s.client_id, c.name as client_name,
                s.origin, s.destination, s.tentative_date,
                s.cargo_type_id, ct.name as cargo_type_name,
                s.weight, s.length, s.width, s.height, s.observations,
                s.operational_notes,
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
            
            WHERE s.id = $1
        `;
        const result = await query<Service>(sql, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ status: 'ERROR', message: 'Service not found' });
            return;
        }
        const service = result.rows[0]!;
        const userRole = (req as AuthenticatedRequest).user?.role;
        const financialRoles = ['admin', 'general_manager', 'sales', 'operations_manager'];
        if (!financialRoles.includes(userRole || '')) {
            const { price, currency_id, currency_code, ...safeService } = service;
            res.status(200).json(safeService as Service);
            return;
        }
        res.status(200).json(service);
    } catch (error: unknown) {
        console.error(`Get Service By ID Error: ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};

export const assignResources = async (req: Request, res: Response<Service | ErrorResponse>): Promise<void> => {
    const { id } = req.params;
    const { driverId, tractorId, trailerId, notes, force } = req.body as AssignResourcesRequest;
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!driverId || !tractorId || !trailerId) {
        res.status(400).json({ status: 'ERROR', message: 'All resources are required' });
        return;
    }
    try {
        await query('BEGIN');
        const currentServiceRes = await query<{ tentative_date: Date, status_name: string }>(`
            SELECT s.tentative_date, ss.name as status_name
            FROM services s 
            JOIN service_statuses ss ON s.status_id = ss.id
            WHERE s.id = $1
        `, [id]);

        if (currentServiceRes.rows.length === 0) {
            await query('ROLLBACK');
            res.status(404).json({ status: 'ERROR', message: 'Service not found' });
            return;
        }
        const serviceData = currentServiceRes.rows[0]!;
        const serviceDate = serviceData.tentative_date;
        const oldStatusName = serviceData.status_name;

        const allowedStatuses = ['pending_assignment'];
        if (!allowedStatuses.includes(oldStatusName)) {
            await query('ROLLBACK');
            res.status(400).json({
                status: 'ERROR',
                message: `Acción denegada: El servicio está '${oldStatusName}'. Solo se puede asignar recursos en 'pending_assignment'.`
            });
            return;
        }

        if (!force) {
            const warnings: string[] = [];

            const dateConflictSql = `
                SELECT id FROM services 
                WHERE tentative_date = $1 
                AND id != $2 
                AND status_id NOT IN (SELECT id FROM service_statuses WHERE name IN ('cancelled', 'completed')) 
                AND (driver_id = $3 OR tractor_id = $4 OR trailer_id = $5)
            `;
            const dateConflicts = await query<{ id: number }>(dateConflictSql, [serviceDate, id, driverId, tractorId, trailerId]);

            if (dateConflicts.rows.length > 0) {
                const conflictIds = dateConflicts.rows.map(row => `#${row.id}`).join(', ');
                warnings.push(`Agenda: Recursos ya programados en los servicios: ${conflictIds} para esta fecha.`);
            }

            const activeRouteSql = `
                SELECT id FROM services 
                WHERE status_id = (SELECT id FROM service_statuses WHERE name = 'in_progress')
                AND id != $1
                AND (driver_id = $2 OR tractor_id = $3 OR trailer_id = $4)
            `;
            const routeConflicts = await query<{ id: number }>(activeRouteSql, [id, driverId, tractorId, trailerId]);

            if (routeConflicts.rows.length > 0) {
                const conflictIds = routeConflicts.rows.map(row => `#${row.id}`).join(', ');
                warnings.push(`Operativo: Uno de los recursos está ACTUALMENTE EN RUTA en el Servicio #${conflictIds}.`);
            }

            if (warnings.length > 0) {
                await query('ROLLBACK');
                res.status(409).json({
                    status: 'WARNING',
                    message: `Conflictos detectados:\n- ${warnings.join('\n- ')}\n¿Desea continuar?`
                });
                return;
            }
        }
        const statusRes = await query<{ id: number }>(`SELECT id FROM service_statuses WHERE name = 'pending_start'`);
        const pendingStartId = statusRes.rows[0]?.id;
        if (!pendingStartId) {
            await query('ROLLBACK');
            res.status(500).json({ status: 'ERROR', message: "Configuration Error: Status 'pending_start' missing" });
            return;
        }
        let noteAppend = '';
        if (notes) {

            const timestamp = new Date().toLocaleString('es-PE');
            noteAppend = `\n[${timestamp}] ASIGNACIÓN: ${notes}`;
        }

        const updateSql = `
            UPDATE services
            SET 
                driver_id = $1,
                tractor_id = $2,
                trailer_id = $3,
                status_id = $4,
                updated_by = $5,
                updated_at = NOW(),
                operational_notes = COALESCE(operational_notes, '') || $6
            WHERE id = $7
            RETURNING *
        `;
        const result = await query<Service>(updateSql, [
            driverId, tractorId, trailerId, pendingStartId, userId,
            noteAppend,
            id
        ]);

        const logSql = `
            INSERT INTO service_audit_logs (service_id, changed_by, change_type, description, old_status, new_status)
            VALUES ($1, $2, 'ASSIGNMENT', 'ASSIGNMENT', $3, 'pending_start')
        `;
        await query(logSql, [id, userId, oldStatusName])

        await query('COMMIT');

        res.status(200).json(result.rows[0]!);
    } catch (error: any) {
        await query('ROLLBACK');
        console.error(`Assign Resources Error: ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};