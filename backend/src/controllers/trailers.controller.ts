import { Request, Response } from "express";
import { query } from "../config/db";
import { Trailer } from "../interfaces/trailers/trailer.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";

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
}