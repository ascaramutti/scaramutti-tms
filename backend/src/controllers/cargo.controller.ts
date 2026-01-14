import { Request, Response } from "express";
import { query } from "../config/db";
import { CargoType } from "../interfaces/cargo/cargo.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";

export const getCargoTypes = async (req: Request, res: Response<CargoType[] | ErrorResponse>): Promise<void> => {
    const { search } = req.query;
    try {
        let sql = `SELECT * FROM cargo_types WHERE is_active = true`;
        const params: any[] = [];
        if (search) {
            sql += ` AND (name ILIKE $1 OR description ILIKE $1)`;
            params.push(`%${search}%`);
        }

        const result = await query<CargoType>(sql, params);
        res.status(200).json(result.rows);
    } catch (error: unknown) {
        console.error(`Get Cargo Types ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};