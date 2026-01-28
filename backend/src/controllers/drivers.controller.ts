import { Request, Response } from "express";
import { query } from "../config/db";
import { CreateDriverRequest, Driver } from "../interfaces/drivers/driver.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";

export const getDrivers = async (req: Request, res: Response<Driver[] | ErrorResponse>): Promise<void> => {
    const { status } = req.query;

    try {

        let sql = `
            SELECT
                d.id,
                w.first_name || ' ' || w.last_name as name,
                w.phone,
                w.document_type_id,
                dt.code as document_type_code,
                w.document_number,
                d.license_number,
                rs.name as status,
                d.is_active
            FROM drivers d
            JOIN workers w ON d.worker_id = w.id
            JOIN document_types dt ON w.document_type_id = dt.id
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

export const createDriver = async (req: Request<{}, {}, CreateDriverRequest>, res: Response<Driver | ErrorResponse>): Promise<void> => {
    const { firstName, lastName, documentTypeId, documentNumber, phone, licenseNumber, category } = req.body;

    try {

        if (!firstName || !lastName || !documentTypeId || !documentNumber || !licenseNumber) {
            res.status(400).json({ status: 'ERROR', message: 'Some fields are required' });
            return;
        }

        // Validate document number format
        const docTypeResult = await query<{ validation_pattern: string | null, max_length: number }>(
            'SELECT validation_pattern, max_length FROM document_types WHERE id = $1',
            [documentTypeId]
        );

        if (docTypeResult.rows.length === 0) {
            res.status(400).json({ status: 'ERROR', message: 'Invalid document type' });
            return;
        }

        const docType = docTypeResult.rows[0]!;
        const { validation_pattern, max_length } = docType;

        if (documentNumber.length > max_length) {
            res.status(400).json({ status: 'ERROR', message: `Document number exceeds maximum length of ${max_length}` });
            return;
        }

        if (validation_pattern) {
            const regex = new RegExp(validation_pattern);
            if (!regex.test(documentNumber)) {
                res.status(400).json({ status: 'ERROR', message: 'Invalid document number format' });
                return;
            }
        }

        await query('BEGIN');

        const workerSql = `
            INSERT INTO workers (first_name, last_name, document_type_id, document_number, phone, position)
            VALUES ($1, $2, $3, $4, $5, 'Conductor')
            RETURNING id
        `;

        const workerResult = await query<{ id: number }>(workerSql, [firstName, lastName, documentTypeId, documentNumber, phone]);
        const workerId = workerResult.rows[0]!.id;

        const statusSql = `SELECT id FROM resource_statuses WHERE name = 'available'`;
        const statusResult = await query<{ id: number }>(statusSql);
        const availableStatusId = statusResult.rows[0]!.id;

        const driverSql = `
            INSERT INTO drivers (worker_id, license_number, category, status_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;

        const driverResult = await query<{ id: number }>(driverSql, [workerId, licenseNumber, category, availableStatusId]);
        const newDriver = driverResult.rows[0]!;

        await query('COMMIT');

        const response: Driver = {

            id: newDriver.id,
            name: `${firstName} ${lastName}`,
            phone: phone || null,
            license_number: licenseNumber,
            status: 'available',
        };

        res.status(201).json(response);

    } catch (error: any) {
        await query('ROLLBACK');
        console.error(`Create Driver ${error}`);

        if (error.code === '23505') {
            res.status(409).json({ status: 'ERROR', message: 'Document number or License Number already exists' });
            return;
        }

        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};