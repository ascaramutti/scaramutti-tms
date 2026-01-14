import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/db";
import { AuthenticatedRequest, AuthRequest, AuthResponse, User } from "../interfaces/auth/auth.interface";
import { ErrorResponse } from "../interfaces/error/error.interface";

export const login =
    async (req: Request<AuthRequest>, res: Response<AuthResponse | ErrorResponse>): Promise<void> => {
        const { username, password } = req.body;

        try {
            if (!username || !password) {
                res.status(400).json({ status: 'ERROR', message: 'Username and password are required' });
                return;
            }

            const sql = `
            SELECT 
                u.id, u.username, u.password_hash, u.worker_id,
                r.name as role,
                r.description as role_description,
                w.first_name || ' ' || w.last_name as name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN workers w ON u.worker_id = w.id
            WHERE u.username = $1 AND u.is_active = true
        `;

            const result = await query<User>(sql, [username]);

            if (result.rows.length === 0) {
                res.status(401).json({ status: 'ERROR', message: 'Invalid credentials' });
                return;
            }

            const user: User = result.rows[0]!;

            const isMatch: boolean = await bcrypt.compare(password!, user.password_hash);

            if (!isMatch) {
                res.status(401).json({ status: 'ERROR', message: 'Invalid credentials' });
                return;
            }

            const secret: string = process.env.JWT_SECRET!;
            const token: string = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                secret,
                {
                    expiresIn: '4h'
                }
            );

            const response: AuthResponse = {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    role_description: user.role_description,
                    name: user.name
                }
            };

            res.status(200).json(response);

        } catch (error: unknown) {
            console.error(`Login ${error}`);
            res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
        }
    };

export const validateSession = async (req: Request, res: Response<AuthResponse | ErrorResponse>): Promise<void> => {
    const { id } = (req as AuthenticatedRequest).user!;

    try {
        const sql = `
            SELECT 
                u.id, u.username, u.password_hash, u.worker_id,
                r.name as role,
                r.description as role_description,
                w.first_name || ' ' || w.last_name as name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN workers w ON u.worker_id = w.id
            WHERE u.id = $1 AND u.is_active = true
        `;

        const result = await query<User>(sql, [id]);

        if (result.rows.length === 0) {
            res.status(401).json({ status: 'ERROR', message: 'User not found or inactive' });
            return;
        }

        const user: User = result.rows[0]!;
        const secret: string = process.env.JWT_SECRET!;

        const token: string = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
            },
            secret,
            {
                expiresIn: '4h'
            }
        );

        const response: AuthResponse = {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                role_description: user.role_description,
                name: user.name
            }
        };

        res.status(200).json(response);

    } catch (error: unknown) {
        console.error(`Validate Session ${error}`);
        res.status(500).json({ status: 'ERROr', message: 'Internal server error' });
    }
}