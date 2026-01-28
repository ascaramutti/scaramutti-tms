import { Request, Response } from "express";
import { query } from "../config/db";
import { CargoType, CargoTypeRequest } from "../interfaces/cargo/cargo.interface";
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
        sql += ` ORDER BY name ASC`;

        const result = await query<CargoType>(sql, params);
        res.status(200).json(result.rows);
    } catch (error: unknown) {
        console.error(`Get Cargo Types ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};

export const createCargoType = async (req: Request<{}, {}, CargoTypeRequest>, res: Response<CargoType | ErrorResponse>): Promise<void> => {
    const { name, description, standardWeight, standardLength, standardWidth, standardHeight } = req.body;

    try {
        if (!name) {
            res.status(400).json({ status: 'ERROR', message: 'Name is required' });
            return;
        }

        if (!standardWeight || standardWeight <= 0) {
            res.status(400).json({ status: 'ERROR', message: 'Standard weight is required and must be greater than 0' });
            return;
        }

        const sql = `
            INSERT INTO cargo_types 
            (name, description, standard_weight, standard_length, standard_width, standard_height)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [
            name.toUpperCase(),
            description || null,
            standardWeight,
            standardLength || null,
            standardWidth || null,
            standardHeight || null
        ];

        const result = await query<CargoType>(sql, values);
        res.status(201).json(result.rows[0]);

    } catch (error: any) {
        console.error(`Create Cargo Type ${error}`);
        if (error.code === '23505') {
            res.status(409).json({ status: 'ERROR', message: 'Cargo type with this name already exists' });
            return;
        }
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};