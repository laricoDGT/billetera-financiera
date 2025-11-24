import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv("", process.cwd(), "");
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function makeSuperAdmin() {
    try {
        const email = 'supertest@example.com';
        console.log(`Promoting ${email} to superadmin...`);
        const res = await pool.query('UPDATE "user" SET role = $1 WHERE email = $2 RETURNING *', ['superadmin', email]);
        if (res.rows.length > 0) {
            console.log('User updated:', res.rows[0]);
        } else {
            console.log('User not found.');
        }
    } catch (err) {
        console.error('Error updating user:', err);
    } finally {
        await pool.end();
    }
}

makeSuperAdmin();
