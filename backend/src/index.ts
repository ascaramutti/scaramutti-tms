// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

// Now import everything else that might use environment variables
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
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
import serviceStatusRouter from './routes/service-statuses.route';
import serviceRouter from './routes/services.route';
import dashboardRouter from './routes/dashboard.route';
import serviceTypesRouter from './routes/service-types.route';
import reportsRouter from './routes/reports.route';

const APP_VERSION = process.env.APP_VERSION || 'v0.0.0';
const DEPLOY_DATE = process.env.DEPLOY_DATE || new Date().toISOString();

const app: Application = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req: Request, res: Response<HealthResponse | ErrorResponse>) => {
    try {
        const result = await query('SELECT NOW()');
        res.json({
            status: 'OK',
            version: APP_VERSION,
            deployed_at: DEPLOY_DATE,
            message: 'Backend running successfully',
            db_time: result.rows[0].now
        });
    } catch (error: unknown) {
        console.error(`Database connection ${error}`);
        res.status(500).json({ 
            status: 'ERROR', 
            version: APP_VERSION,
            message: 'Database connection failed' 
        });
    }
});

app.use('/api/auth', authRouter);
app.use('/api/clients', clientRouter);
app.use('/api/cargo-types', cargoRouter);
app.use('/api/drivers', driverRouter);
app.use('/api/tractors', tractorRouter);
app.use('/api/trailers', trailerRouter);
app.use('/api/currencies', currencyRouter);
app.use('/api/service-statuses', serviceStatusRouter);
app.use('/api/services', serviceRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/service-types', serviceTypesRouter);
app.use('/api/reports', reportsRouter);


app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
});
