import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, TokenPayload } from "../interfaces/auth/auth.interface";

export const validateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader: string | undefined = req.headers['authorization'];
    const token: string | undefined = authHeader && authHeader.split(' ')[1];

    if(!token) {
        res.status(401).json({ status: 'ERROR', message: 'Access denied. No token provided.' });
        return;
    }

    try {

        const secret: string = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret) as TokenPayload;

        (req as AuthenticatedRequest).user = decoded;

        next();

    } catch (error) {
        res.status(403).json({ status: 'ERROR', message: 'Invalid or expired token. '});
    }
};

export const authorizeRoles = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as AuthenticatedRequest).user;

        if (!user || !allowedRoles.includes(user.role)) {
            res.status(403).json({
                status: 'ERROR',
                message: 'Access denied. Insufficient permissions to perform this action.'
            });
            return;
        }
        next();
    };
};