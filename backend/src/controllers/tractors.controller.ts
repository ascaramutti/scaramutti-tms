import { Request, Response } from "express";
import { query } from "../config/db";
import { Tractor, TractorRequest } from "../interfaces/tractors/tractor.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";

export const getTractors = async (req: Request, res: Response<Tractor[] | ErrorResponse>): Promise<void> => {
    const { status } = req.query;

    try {
        let sql =`
            SELECT 
                t.id, t.plate, t.brand, t.model,
                rs.name as status
            FROM tractors t
            LEFT JOIN resource_statuses rs ON t.status_id = rs.id
            WHERE t.is_active = true
        `;

        const params: any[] = [];
        if (status) {
            sql += ` AND rs.name = $1`;
            params.push(status);
        }

        sql += ` ORDER BY t.plate ASC`;

        const result = await query<Tractor>(sql, params);
        res.status(200).json(result.rows);
    } catch (error: unknown) {
        console.error(`Get Tractor ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};

export const createTractor = async (req: Request<{}, {}, TractorRequest>, res: Response<Tractor | ErrorResponse>): Promise<void> => {
    const { plate, brand, model, year } = req.body;

    try {

        if (!plate) {
            res.status(400).json({ status: 'ERROR', message: 'Plate is required' });
            return;
        }

        const statusSql = `SELECT id FROM resource_statuses WHERE name = 'available'`;
        const statusResult = await query<{id: number}>(statusSql);
        const availableStatusId = statusResult.rows[0]!.id;

        const sql = `
            INSERT INTO tractors (plate, brand, model, year, status_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;

        const result = await query<Tractor>(sql, [plate.toUpperCase(), brand, model, year, availableStatusId]);
        const newTractor = result.rows[0]!;

        const response: Tractor = {
            id: newTractor.id,
            plate: plate.toUpperCase(),
            brand: brand || null,
            model: model || null,
            status: 'available',
        };

        res.status(201).json(response);

    } catch (error: any) {
        console.error(`Create Tractor ${error}`);
        if (error.code === '23505') {
            res.status(409).json({ status: 'ERROR', message: 'Tractor with this plate already exists' });
            return;
        }
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
}