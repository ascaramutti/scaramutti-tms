import { Request, Response } from "express";
import { query } from "../config/db";
import { Service, CreateServiceRequest, AssignResourcesRequest, ChangeStatusRequest, UpdateServiceRequest } from "../interfaces/services/service.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";
import { AuthenticatedRequest } from "../interfaces/auth/auth.interface";
import { CreateServiceAssignmentDTO, ServiceAssignment } from "../interfaces/service-assignments.interface";
import { checkAllConflicts, checkDuplicateInSameService } from "../services/service-assignments.service";

export const createService = async (req: Request<{}, {}, CreateServiceRequest>, res: Response<Service | ErrorResponse>): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const {
        clientId, origin, destination, tentativeDate, serviceTypeId, cargoTypeId,
        weight, length, width, height, observations, price, currencyId
    } = req.body;

    try {
        if (!clientId || !origin || !destination || !tentativeDate || !serviceTypeId || !cargoTypeId || !weight || !price || !currencyId) {
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
                service_type_id,
                cargo_type_id, weight, length, width, height, observations,
                price, currency_id,
                status_id, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
            RETURNING *
        `;

        const values = [
            clientId, origin, destination, tentativeDate,
            serviceTypeId,
            cargoTypeId, weight, length || null, width || null, height || null, observations || null,
            price, currencyId,
            pendingStatusId, userId
        ];

        const result = await query<Service>(sql, values);
        const newService = result.rows[0];

        const logSql = `
            INSERT INTO service_audit_logs (service_id, changed_by, change_type, field_name, field_label, old_value, new_value, description)
            VALUES ($1, $2, 'CREATED', 'status', 'Estado', 'N/A', 'pending_assigment', 'Service created')
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

export const getServices = async (req: Request, res: Response): Promise<void> => {
    const { status, clientId, date, search, limit, offset, sort } = req.query;

    try {
        // Build WHERE clause for both queries
        let whereClause = 'WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            whereClause += ` AND ss.name = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (clientId) {
            whereClause += ` AND s.client_id = $${paramIndex}`;
            params.push(clientId);
            paramIndex++;
        }
        if (date) {
            whereClause += ` AND s.tentative_date = $${paramIndex}`;
            params.push(date);
            paramIndex++;
        }
        if (search) {
            const searchTerm = `%${search}%`;
            whereClause += ` AND (
                s.id::text ILIKE $${paramIndex} OR 
                c.name ILIKE $${paramIndex} OR 
                s.origin ILIKE $${paramIndex} OR 
                s.destination ILIKE $${paramIndex}
            )`;
            params.push(searchTerm);
            paramIndex++;
        }

        // First, get the total count
        const countSql = `
            SELECT COUNT(*) as total
            FROM services s
            JOIN clients c ON s.client_id = c.id
            JOIN service_statuses ss ON s.status_id = ss.id
            ${whereClause}
        `;
        const countResult = await query<{ total: string }>(countSql, params);
        const total = parseInt(countResult.rows[0]?.total || '0');

        // Then get the paginated services
        let sql = `
            SELECT
                s.id,
                s.client_id, c.name as client_name, c.ruc as client_ruc,
                s.origin, s.destination, s.tentative_date,
                s.service_type_id, st.name as service_type_name,
                s.cargo_type_id, ct.name as cargo_type_name,
                s.weight, s.length, s.width, s.height, s.observations,
                s.operational_notes,
                s.start_date_time, s.end_date_time,
                s.created_at, s.updated_at,
                s.price,
                s.currency_id, cur.code as currency_code,

                s.driver_id, (w.first_name || ' ' || w.last_name) as driver_name,
                s.tractor_id, tr.plate as tractor_plate,
                s.trailer_id, tl.plate as trailer_plate,

                s.status_id, ss.name as status_name,

                (SELECT COUNT(*) FROM service_assignments sa WHERE sa.service_id = s.id) as additional_assignments_count
            FROM services s
            JOIN clients c ON s.client_id = c.id
            JOIN service_types st ON s.service_type_id = st.id
            JOIN cargo_types ct ON s.cargo_type_id = ct.id
            JOIN currencies cur ON s.currency_id = cur.id
            JOIN service_statuses ss ON s.status_id = ss.id
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN workers w ON d.worker_id = w.id
            LEFT JOIN tractors tr ON s.tractor_id = tr.id
            LEFT JOIN trailers tl ON s.trailer_id = tl.id
            
            ${whereClause}
        `;

        // Sorting
        if (sort === 'recent') {
            sql += ` ORDER BY s.updated_at DESC`;
        } else {
            sql += ` ORDER BY s.tentative_date ASC, s.created_at ASC`;
        }

        // Pagination
        if (limit) {
            sql += ` LIMIT $${paramIndex}`;
            params.push(parseInt(limit as string));
            paramIndex++;
        }
        if (offset) {
            sql += ` OFFSET $${paramIndex}`;
            params.push(parseInt(offset as string));
            paramIndex++;
        }

        const result = await query<Service>(sql, params);

        const userRole = (req as AuthenticatedRequest).user?.role;
        const financialRoles = ['admin', 'general_manager', 'sales', 'operations_manager'];

        const services: Service[] = result.rows.map((service: any) => {
            // Map snake_case to camelCase and exclude original snake_case field
            const { additional_assignments_count, ...restService } = service;
            const mappedService: Service = {
                ...restService,
                additionalAssignmentsCount: parseInt(additional_assignments_count || '0')
            };

            if (!financialRoles.includes(userRole || '')) {
                const { price, currency_id, currency_code, ...safeService } = mappedService;
                return safeService;
            }
            return mappedService;
        });

        // Return both services and total count
        res.status(200).json({ services, total });
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
                s.client_id, c.name as client_name, c.ruc as client_ruc,
                s.origin, s.destination, s.tentative_date,
                 s.service_type_id, st.name as service_type_name,
                s.cargo_type_id, ct.name as cargo_type_name,
                s.weight, s.length, s.width, s.height, s.observations,
                s.operational_notes,
                s.start_date_time, s.end_date_time,
                s.price,
                s.currency_id, cur.code as currency_code,
                
                s.driver_id, (w.first_name || ' ' || w.last_name) as driver_name,
                s.tractor_id, tr.plate as tractor_plate,
                s.trailer_id, tl.plate as trailer_plate,
                
                s.status_id, ss.name as status_name
            FROM services s
            JOIN clients c ON s.client_id = c.id
            JOIN service_types st ON s.service_type_id = st.id
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

        // US-003: Obtener asignaciones adicionales
        const additionalAssignmentsQuery = `
            SELECT
                sa.id,
                sa.truck_id,
                t.plate as truck_plate,
                t.model as truck_model,
                sa.trailer_id,
                tr.plate as trailer_plate,
                tr.type as trailer_type,
                sa.driver_id,
                w.first_name || ' ' || w.last_name as driver_name,
                sa.notes,
                sa.assigned_by,
                u.username as assigned_by_username,
                sa.assigned_at
            FROM service_assignments sa
            LEFT JOIN tractors t ON sa.truck_id = t.id
            LEFT JOIN trailers tr ON sa.trailer_id = tr.id
            LEFT JOIN drivers d ON sa.driver_id = d.id
            LEFT JOIN workers w ON d.worker_id = w.id
            JOIN users u ON sa.assigned_by = u.id
            WHERE sa.service_id = $1
            ORDER BY sa.assigned_at ASC
        `;

        const additionalResult = await query(additionalAssignmentsQuery, [id]);

        // Mapear asignaciones adicionales
        service.additionalAssignments = additionalResult.rows.map((row: any) => ({
            id: row.id,
            truck: row.truck_id ? { id: row.truck_id, plate: row.truck_plate, model: row.truck_model } : null,
            trailer: row.trailer_id ? { id: row.trailer_id, plate: row.trailer_plate, type: row.trailer_type } : null,
            driver: row.driver_id ? { id: row.driver_id, name: row.driver_name } : null,
            notes: row.notes,
            assignedBy: { id: row.assigned_by, name: row.assigned_by_username },
            assignedAt: row.assigned_at
        }));

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
    if (!driverId || !tractorId) {
        res.status(400).json({ status: 'ERROR', message: 'Driver and tractor are required' });
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

            const busyResourceSql = `
                SELECT s.id, ss.name as status_name
                FROM services s
                JOIN service_statuses ss ON s.status_id = ss.id
                WHERE ss.name IN ('pending_start', 'in_progress')
                AND s.id != $1
                AND (
                    s.driver_id = $2
                    OR s.tractor_id = $3
                    OR (s.trailer_id = $4 AND $4 IS NOT NULL)
                )
            `;

            const conflicts = await query<{ id: number, status_name: string }>(busyResourceSql, [id, driverId, tractorId, trailerId]);

            if (conflicts.rows.length > 0) {
                const conflictDetails = conflicts.rows.map(row => {
                    const statusLabel = row.status_name === 'in_progress' ? 'EN RUTA' : 'ASIGNADO';
                    return `#${row.id} (${statusLabel})`;
                }).join(', ');
                warnings.push(`Uno o más recursos ya están comprometidos en: ${conflictDetails}.`);
            }

            if (warnings.length > 0) {
                await query('ROLLBACK');
                res.status(409).json({
                    status: 'WARNING',
                    message: `Conflictos detectados:\n- ${warnings.join('\n- ')}\n¿Desea continuar de todos modos?`
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
            INSERT INTO service_audit_logs (service_id, changed_by, change_type, field_name, field_label, old_value, new_value, description)
            VALUES ($1, $2, 'ASSIGNMENT', 'status', 'Estado', $3, 'pending_start', 'ASSIGNMENT')
        `;
        await query(logSql, [id, userId, oldStatusName])

        await query('COMMIT');

        const updatedService = result.rows[0]!;
        const successMessage = trailerId
            ? 'Servicio asignado correctamente'
            : 'Servicio asignado correctamente (sin trailer)';

        res.status(200).json({
            ...updatedService,
            message: successMessage
        });
    } catch (error: any) {
        await query('ROLLBACK');
        console.error(`Assign Resources Error: ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};

export const changeStatus = async (req: Request, res: Response<Service | ErrorResponse>): Promise<void> => {
    const { id } = req.params;
    const { status, notes, date } = req.body as ChangeStatusRequest;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!status) {
        res.status(400).json({ status: 'ERROR', message: 'New status is required' });
        return;
    }

    try {
        await query('BEGIN');
        const currentRes = await query<{ status_name: string }>(
            `SELECT ss.name as status_name FROM services s JOIN service_statuses ss ON s.status_id = ss.id WHERE s.id = $1`,
            [id]
        );

        if (currentRes.rows.length === 0) {
            await query('ROLLBACK');
            res.status(404).json({ status: 'ERROR', message: 'Service not found' });
            return;
        }
        const currentStatus = currentRes.rows[0]!.status_name;

        const validTransitions: Record<string, string[]> = {
            'pending_assignment': ['cancelled'],
            'pending_start': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        };

        if (!validTransitions[currentStatus]?.includes(status)) {
            await query('ROLLBACK');
            res.status(400).json({
                status: 'ERROR',
                message: `Transición inválida: No se puede pasar de '${currentStatus}' a '${status}'.`
            });
            return;
        }

        const newStatusRes = await query<{ id: number }>(`SELECT id FROM service_statuses WHERE name = $1`, [status]);
        const newStatusId = newStatusRes.rows[0]?.id;

        if (!newStatusId) {
            await query('ROLLBACK');
            res.status(400).json({ status: 'ERROR', message: `Invalid status name: ${status}` });
            return;
        }

        const timestamp = new Date().toLocaleString('es-PE');
        let noteAppend = '';
        if (notes) {
            noteAppend = `\n[${timestamp}] CAMBIO A ${status.toUpperCase()}: ${notes || ''}`;
        }
        if (date) {
            noteAppend += ` (Fecha Manual: ${date})`;
        }

        const updateSql = `
            UPDATE services
            SET 
                status_id = $1,
                updated_by = $2,
                updated_at = NOW(),
                operational_notes = COALESCE(operational_notes, '') || $3,
                start_date_time = CASE WHEN $5 = 'in_progress' THEN COALESCE($6, NOW()) ELSE start_date_time END,
                end_date_time = CASE WHEN $5 = 'completed' THEN COALESCE($6, NOW()) ELSE end_date_time END
            WHERE id = $4
            RETURNING *
        `;
        const result = await query<Service>(updateSql, [newStatusId, userId, noteAppend, id, status, date]);

        await query(
            `INSERT INTO service_audit_logs (service_id, changed_by, change_type, field_name, field_label, old_value, new_value, description) VALUES ($1, $2, 'STATUS_CHANGE', 'status', 'Estado', $3, $4, $5)`,
            [id, userId, currentStatus, status, `Status updated to ${status}`]
        );

        await query('COMMIT');
        res.status(200).json(result.rows[0]!);

    } catch (error) {
        await query('ROLLBACK');
        console.error(`Change Status Error: ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};

export const updateService = async (req: Request, res: Response<Service | ErrorResponse>): Promise<void> => {
    const { id } = req.params;
    const body = req.body as UpdateServiceRequest;
    const userId = (req as AuthenticatedRequest).user?.id;
    const userRole = (req as AuthenticatedRequest).user?.role;

    // Validación 1: Justificación obligatoria (mínimo 10 caracteres)
    if (!body.description || body.description.trim().length < 10) {
        res.status(400).json({
            status: 'ERROR',
            message: body.description ? 'La justificación debe tener al menos 10 caracteres' : 'Debe ingresar una justificación para los cambios'
        });
        return;
    }

    // Validación 2: Solo admin puede editar statusId
    if (body.statusId && userRole !== 'admin') {
        res.status(403).json({
            status: 'ERROR',
            message: 'Solo administradores pueden cambiar el estado del servicio'
        });
        return;
    }

    const fieldMap: Record<string, string> = {
        clientId: 'client_id',
        origin: 'origin',
        destination: 'destination',
        tentativeDate: 'tentative_date',
        serviceTypeId: 'service_type_id',
        cargoTypeId: 'cargo_type_id',
        weight: 'weight',
        length: 'length',
        width: 'width',
        height: 'height',
        observations: 'observations',
        price: 'price',
        currencyId: 'currency_id',
        driverId: 'driver_id',
        tractorId: 'tractor_id',
        trailerId: 'trailer_id',
        statusId: 'status_id',
        startDateTime: 'start_date_time',
        endDateTime: 'end_date_time',
        operationalNotes: 'operational_notes'
    };

    try {
        await query('BEGIN');

        // Obtener valores actuales del servicio completo
        const currentServiceRes = await query<any>(
            `SELECT
                s.client_id, s.origin, s.destination, s.tentative_date,
                s.service_type_id, s.cargo_type_id,
                s.weight, s.length, s.width, s.height, s.observations,
                s.price, s.currency_id,
                s.driver_id, s.tractor_id, s.trailer_id,
                s.status_id, s.start_date_time, s.end_date_time, s.operational_notes,
                ss.name as status_name
            FROM services s
            JOIN service_statuses ss ON s.status_id = ss.id
            WHERE s.id = $1`,
            [id]
        );

        if (currentServiceRes.rows.length === 0) {
            await query('ROLLBACK');
            res.status(404).json({ status: 'ERROR', message: 'Service not found' });
            return;
        }

        const currentService = currentServiceRes.rows[0];

        // Comparar valores actuales vs nuevos para detectar cambios reales
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        let hasChanges = false;

        Object.keys(body).forEach(key => {
            if (key === 'description') return; // Skip description field

            const dbCol = fieldMap[key];
            const newValue = body[key as keyof UpdateServiceRequest];

            if (dbCol && newValue !== undefined) {
                const currentValue = currentService[dbCol];

                // Comparar valores (convertir a string para comparación consistente)
                const currentStr = currentValue != null ? String(currentValue) : null;
                const newStr = newValue != null ? String(newValue) : null;

                if (currentStr !== newStr) {
                    updates.push(`${dbCol} = $${paramIndex}`);
                    values.push(newValue);
                    paramIndex++;
                    hasChanges = true;
                }
            }
        });

        // Validación 3: Al menos un campo debe haber cambiado
        if (!hasChanges) {
            await query('ROLLBACK');
            res.status(400).json({ status: 'ERROR', message: 'No se detectaron cambios en el servicio' });
            return;
        }

        updates.push(`updated_by = $${paramIndex}`);
        values.push(userId);
        paramIndex++;

        updates.push(`updated_at = NOW()`);

        values.push(id);
        const sql = `
            UPDATE services
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await query<Service>(sql, values);

        if (result.rows.length === 0) {
            await query('ROLLBACK');
            res.status(404).json({ status: 'ERROR', message: 'Service not found' });
            return;
        }

        // Por ahora, registro genérico de auditoría (Tarea 4: auditoría por campo)
        const oldStatusName = currentService.status_name;
        const newStatusName = body.statusId
            ? (await query<{ name: string }>(`SELECT name FROM service_statuses WHERE id = $1`, [body.statusId])).rows[0]?.name || oldStatusName
            : oldStatusName;

        await query(
            `INSERT INTO service_audit_logs (service_id, changed_by, change_type, field_name, field_label, old_value, new_value, description) VALUES ($1, $2, 'ADMIN_UPDATE', 'status', 'Estado', $3, $4, $5)`,
            [id, userId, oldStatusName, newStatusName, body.description]
        );

        await query('COMMIT');
        res.status(200).json(result.rows[0]);

    } catch (error) {
        await query('ROLLBACK');
        console.error(`Update Service Error: ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};

/**
 * POST /api/services/:id/assignments
 * US-003: Agrega unidades adicionales (tracto, trailer, conductor) a un servicio en ejecución
 *
 * @param req.params.id - ID del servicio
 * @param req.body - CreateServiceAssignmentDTO
 * @param req.user.id - ID del usuario autenticado (del token JWT)
 *
 * @returns 200 - Asignación creada exitosamente
 * @returns 400 - Validación fallida
 * @returns 404 - Servicio no encontrado
 * @returns 409 - Conflictos detectados (requiere force=true)
 */
export const addServiceAssignment = async (req: Request, res: Response) => {
  try {
    const serviceId = parseInt(req.params.id as string);
    const dto: CreateServiceAssignmentDTO = req.body;
    const userId = (req as AuthenticatedRequest).user?.id;

    // ====================================
    // VALIDACIONES
    // ====================================

    // 1. Validar que al menos UNA unidad esté presente
    if (!dto.truckId && !dto.trailerId && !dto.driverId) {
      res.status(400).json({
        status: 'ERROR',
        message: 'Debe seleccionar al menos un recurso (tracto, trailer o conductor)'
      });
      return;
    }

    // 2. Validar que notes sea obligatorio y mínimo 10 caracteres
    if (!dto.notes || dto.notes.trim().length < 10) {
      res.status(400).json({
        status: 'ERROR',
        message: 'El campo "notes" es obligatorio y debe tener mínimo 10 caracteres'
      });
      return;
    }

    // 3. Verificar que el servicio existe
    const serviceCheck = await query(
      'SELECT id, status_id FROM services WHERE id = $1',
      [serviceId]
    );

    if (serviceCheck.rows.length === 0) {
      res.status(404).json({
        status: 'ERROR',
        message: `Servicio #${serviceId} no encontrado`
      });
      return;
    }

    const service = serviceCheck.rows[0];

    // 4. Validar que el servicio esté en estado "in_progress" (status_id = 3)
    if (service.status_id !== 3) {
      res.status(400).json({
        status: 'ERROR',
        message: 'Solo se pueden agregar recursos a servicios en estado "En progreso"'
      });
      return;
    }

    // ====================================
    // VALIDACIÓN DE DUPLICADOS (NO NEGOCIABLE)
    // ====================================

    // Verificar si el recurso ya está asignado al MISMO servicio
    const duplicates = await checkDuplicateInSameService(
      dto.truckId,
      dto.trailerId,
      dto.driverId,
      serviceId
    );

    if (duplicates.length > 0) {
      // Duplicados son un ERROR, no se puede forzar
      res.status(400).json({
        status: 'ERROR',
        message: `No se puede agregar el mismo recurso dos veces:\n\n${duplicates.join('\n')}`
      });
      return;
    }

    // ====================================
    // DETECCIÓN DE CONFLICTOS (PUEDE FORZARSE)
    // ====================================

    // Si force !== true, verificar conflictos con OTROS servicios
    if (dto.force !== true) {
      const conflicts = await checkAllConflicts(
        dto.truckId,
        dto.trailerId,
        dto.driverId,
        serviceId
      );

      if (conflicts.length > 0) {
        // Hay conflictos con otros servicios, retornar 409 (puede forzarse)
        const conflictMessage = conflicts.join('\n');
        res.status(409).json({
          status: 'WARNING',
          message: `Conflictos detectados:\n\n${conflictMessage}\n\n¿Desea continuar de todos modos?`
        });
        return;
      }
    }

    // ====================================
    // INSERTAR ASIGNACIÓN
    // ====================================

    const insertQuery = `
      INSERT INTO service_assignments (
        service_id,
        truck_id,
        trailer_id,
        driver_id,
        notes,
        assigned_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const insertResult = await query<ServiceAssignment>(insertQuery, [
      serviceId,
      dto.truckId || null,
      dto.trailerId || null,
      dto.driverId || null,
      dto.notes.trim(),
      userId
    ]);

    const newAssignment = insertResult.rows[0];

    if (!newAssignment) {
      res.status(500).json({
        status: 'ERROR',
        message: 'Error al crear la asignación'
      });
      return;
    }

    // ====================================
    // RESPUESTA EXITOSA
    // ====================================

    // PostgreSQL retorna campos en snake_case
    const result = newAssignment as any;

    res.status(200).json({
      status: 'OK',
      message: 'Recursos agregados exitosamente al servicio',
      data: {
        id: result.id,
        serviceId: result.service_id,
        truckId: result.truck_id,
        trailerId: result.trailer_id,
        driverId: result.driver_id,
        notes: result.notes,
        assignedBy: result.assigned_by,
        assignedAt: result.assigned_at
      }
    });

  } catch (error: any) {
    console.error('Error in addServiceAssignment:', error);

    // Error de foreign key (unidad no existe)
    if (error.code === '23503') {
      res.status(400).json({
        status: 'ERROR',
        message: 'Una o más unidades seleccionadas no existen'
      });
      return;
    }

    // Error de constraint (at_least_one_unit)
    if (error.code === '23514') {
      res.status(400).json({
        status: 'ERROR',
        message: 'Debe seleccionar al menos un recurso'
      });
      return;
    }

    res.status(500).json({
      status: 'ERROR',
      message: 'Error interno al agregar recursos'
    });
  }
};

