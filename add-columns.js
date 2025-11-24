import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv("", process.cwd(), "");
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function addColumns() {
    try {
        console.log('Adding role column...');
        await pool.query(`
            ALTER TABLE "user" 
            ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user',
            ADD COLUMN IF NOT EXISTS "banned" BOOLEAN DEFAULT false;
        `);
        console.log('Columns added successfully.');
    } catch (err) {
        console.error('Error adding columns:', err);
    } finally {
        await pool.end();
    }
}

addColumns();
