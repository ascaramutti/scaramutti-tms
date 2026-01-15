import { Request, Response } from "express";
import { query } from "../config/db";
import { Trailer, TrailerRequest } from "../interfaces/trailers/trailer.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";
import { json } from "node:stream/consumers";

export const getTrailers = async (req: Request, res: Response<Trailer[] | ErrorResponse>): Promise<void> => {
    const { status } = req.query;

    try {
        let sql = `
            SELECT 
                t.id, t.plate, t.type,
                rs.name as status
            FROM trailers t
            LEFT JOIN resource_statuses rs ON t.status_id = rs.id
            WHERE t.is_active = true
        `;

        const params: any[] = [];
        if (status) {
            sql += ` AND rs.name = $1`;
            params.push(status);
        }

        sql += ` ORDER BY t.plate ASC`;

        const result = await query<Trailer>(sql, params);
        res.status(200).json(result.rows);

    } catch (error: unknown) {
        console.error(`Get Trailers ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};

export const createTrailer = async (req: Request<{}, {}, TrailerRequest>, res: Response<Trailer | ErrorResponse>): Promise<void> => {
    const { plate, type } = req.body;
    try {
        if(!plate) {
            res.status(400).json({ status: 'ERROR', message: 'Plate is required' });
            return;
        }

        const statusSql = `SELECT id FROM resource_statuses WHERE name = 'available'`;
        const statusResult = await query<{id: number}>(statusSql);
        const availableStatusId = statusResult.rows[0]!.id;

        const sql = `
            INSERT INTO trailers (plate, type, status_id)
            VALUES ($1, $2, $3)
            RETURNING id, is_active
        `;

        const result = await query(sql, [plate.toUpperCase(), type, availableStatusId]);
        const newTrailer = result.rows[0]!;

        const response: Trailer = {
            id: newTrailer.id,
            plate: plate.toUpperCase(),
            type: type || null,
            status: 'available'
        }

        res.status(201).json(response);

    } catch (error: any) {
        console.error(`Create Trailer ${error}`);
        if (error.code === '23505') {
            res.status(500).json({ status: 'ERROR', message: 'Traier with this plate already exists' });
            return;
        }
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
}