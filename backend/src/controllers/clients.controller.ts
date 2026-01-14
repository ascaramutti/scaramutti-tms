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

export const createClient = async (req: Request<{}, {}, ClientRequest>, res: Response<Client | ErrorResponse>): Promise<void> => {
    const { name, ruc, phone, contactName } = req.body;

    try {

        if (!name || !ruc) {
            res.status(400).json({ status: 'ERROR', message: 'Name and RUC are required'});
            return;
        }

        const sql = `
            INSERT INTO clients (name, ruc, phone, contact_name)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const result = await query<Client>(sql, [name, ruc, phone, contactName]);
        res.status(201).json(result.rows[0]);

    } catch (error: any) {
        console.error(`Create client ${error}`);
        if(error.code === '23505') {
            res.status(409).json({ status: 'ERROR', message: 'Client with this RUC already exists' });
            return;
        }
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};