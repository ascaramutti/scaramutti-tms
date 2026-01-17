import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './config/db';
import { HealthResponse } from './interfaces/health/health.interface';
import { ErrorResponse } from './interfaces/error/error.interface';
import authRouter from './routes/auth.route';
import clientRouter from './routes/clients.route';
import cargoRouter from './routes/cargo.route';
import driverRouter from './routes/drivers.route';
import tractorRouter from './routes/tractors.route';
import trailerRouter from './routes/trailers.route';
import currencyRouter from './routes/currencies.route';

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

app.use('/api/auth', authRouter);
app.use('/api/clients', clientRouter);
app.use('/api/cargo-types', cargoRouter);
app.use('/api/drivers', driverRouter);
app.use('/api/tractors', tractorRouter);
app.use('/api/trailers', trailerRouter);
app.use('/api/currencies', currencyRouter);


app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
});
