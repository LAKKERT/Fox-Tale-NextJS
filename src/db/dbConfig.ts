// dbConfig.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export default async function Connect() {
    try {
        const pool = new Pool({
            database: process.env.PGSQL_DATABASE,
            user: process.env.PGSQL_USERNAME,
            password: process.env.PGSQL_PASSWORD,
            host: process.env.PGSQL_HOST,
            port: Number(process.env.PGSQL_PORT) || undefined,
            ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
        });

        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();

        console.log('Connected to PostgreSQL database');
        return pool;
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}