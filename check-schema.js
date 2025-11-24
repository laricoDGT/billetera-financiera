import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv("", process.cwd(), "");
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkSchema() {
    try {
        const res = await pool.query('SELECT * FROM "user" LIMIT 1');
        if (res.rows.length > 0) {
            console.log('User columns:', Object.keys(res.rows[0]));
        } else {
            console.log('No users found, but table exists.');
            // Get column names from information_schema
            const schemaRes = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'user'
            `);
            console.log('Schema columns:', schemaRes.rows.map(r => r.column_name));
        }
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
