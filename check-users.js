import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv("", process.cwd(), "");
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function listUsers() {
    try {
        const res = await pool.query('SELECT id, email, name, role FROM "user"');
        console.log('Users found:', res.rows);
    } catch (err) {
        console.error('Error listing users:', err);
    } finally {
        await pool.end();
    }
}

listUsers();
