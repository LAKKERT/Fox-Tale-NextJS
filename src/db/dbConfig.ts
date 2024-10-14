const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const user = process.env.PGSQL_USERNAME;

async function Connect() {
    try {
        const pool = new Pool({
            database: process.env.PGSQL_DATABASE,
            user: process.env.PGSQL_USERNAME,
            password: process.env.PGSQL_PASSWORD,
            host: process.env.PGSQL_HOST,
            port: process.env.PGSQL_PORT,
        });
        const client = await pool.connect()
        await client.query('SELECT NOW()');
        client.release();
        console.log('Connected to PostgreSQL database');
        return pool;
    }catch(error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

module.exports = Connect;