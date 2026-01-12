import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './config/db';
import { HealthResponse } from './interfaces/health/health';
import { ErrorResponse } from './interfaces/error/error';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req: Request, res: Response<HealthResponse | ErrorResponse>) => {
    try {
        const result = await query('SELECT NOW()');
        res.json({
            status: 'OK',
            message: 'Backend running successfuly',
            db_time: result.rows[0].now
        });
    } catch (error: unknown) {
        console.error(`Database connection ${error}`);
        res.status(500).json({ status: 'ERROR', message: 'Database connection failed' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
});
