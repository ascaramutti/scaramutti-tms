import { Request, Response } from "express";
import { query } from "../config/db";
import { Client, ClientRequest } from "../interfaces/clients/client.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";

export const getClients = async (req: Request, res: Response<Client[] | ErrorResponse>): Promise<void> => {
    const { search } = req.query;

    try {
        let sql = `SELECT * FROM clients WHERE is_active = true`;
        const params: any[] = [];

        if (search) {
            sql += ` AND (name ILIKE $1 OR ruc ILIKE $1)`;
            params.push(`%${search}%`);
        }

        sql += ` ORDER BY name ASC`;

        const result = await query<Client>(sql, params);
        res.status(200).json(result.rows);

    } catch (error: unknown) {
        console.error(`Get Clients ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};