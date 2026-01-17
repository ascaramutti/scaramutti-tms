import { Request, Response } from "express";
import { query } from "../config/db";
import { Currency } from "../interfaces/currencies/currency.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";

export const getCurrencies = async (req: Request, res: Response<Currency[] | ErrorResponse>): Promise<void> => {
    try {
        const sql = `
            SELECT id, code, symbol, name
            FROM currencies
            WHERE is_active = true
            ORDER BY id ASC
        `;

        const result = await query<Currency>(sql);
        res.status(200).json(result.rows);

    } catch (error: unknown) {
        console.error(`Get currencies ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
    }
};