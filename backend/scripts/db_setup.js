require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

async function checkAndCreateDatabase() {
    const rootClient = new Client({ ...config, database: 'postgres' });
    try {
        await rootClient.connect();
        const targetDb = process.env.DB_NAME;
        const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDb]);
        
        if (res.rowCount === 0) {
            console.log(`Creando base de datos ${targetDb}...`);
            await rootClient.query(`CREATE DATABASE "${targetDb}"`);
            console.log(`Base de datos creada.`);
        } else {
            console.log(`La base de datos ${targetDb} ya existe.`);
        }
    } catch (err) {
        console.error('Error al conectar (revisar contraseña/IP):', err.message);
        process.exit(1);
    } finally {
        await rootClient.end();
    }
}

async function runSqlFile(client, filename) {
    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Ejecutando ${filename}...`);
    await client.query(sql);
}

async function setup() {
    console.log('--- Iniciando Configuración de DB ---');
    await checkAndCreateDatabase();

    const client = new Client({ ...config, database: process.env.DB_NAME });
    await client.connect();

    try {
        await runSqlFile(client, 'init_db.sql');
        await runSqlFile(client, 'seed_db.sql');
        console.log('--- ¡INSTALACIÓN COMPLETADA CON ÉXITO! ---');
    } catch (err) {
        console.error('Error durante la ejecución de scripts:', err);
    } finally {
        await client.end();
    }
}

setup();