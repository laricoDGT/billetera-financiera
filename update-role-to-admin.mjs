import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function updateUserRole() {
    try {
        console.log('Updating supertest@example.com role from "superadmin" to "admin"...\n');

        const result = await pool.query(
            'UPDATE "user" SET role = $1 WHERE email = $2 RETURNING id, email, name, role',
            ['admin', 'supertest@example.com']
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('✅ Role updated successfully:');
            console.log('  Email:', user.email);
            console.log('  Name:', user.name);
            console.log('  New Role:', user.role);
        } else {
            console.log('❌ User not found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

updateUserRole();
