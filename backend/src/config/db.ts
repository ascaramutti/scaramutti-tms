import { Pool, QueryResultRow } from 'pg';

const pool: Pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT!),
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = <T extends QueryResultRow = any>(text: string, params?: any[]) => pool.query<T>(text, params);
export default pool;