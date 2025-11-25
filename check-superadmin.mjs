import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkUser() {
    try {
        const result = await pool.query(
            'SELECT id, email, name, role, banned FROM "user" WHERE email = $1',
            ['supertest@example.com']
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found: supertest@example.com');
            console.log('Creating user with superadmin role...');

            // Note: This won't work without proper password hashing
            // User should be created through the registration flow
            console.log('Please register the user through /register first');
        } else {
            const user = result.rows[0];
            console.log('✅ User found:');
            console.log('  ID:', user.id);
            console.log('  Email:', user.email);
            console.log('  Name:', user.name);
            console.log('  Role:', user.role);
            console.log('  Banned:', user.banned);

            if (user.role !== 'admin') {
                console.log('\n⚠️  User role is not "admin"');
                console.log('Updating role to "admin"...');

                await pool.query(
                    'UPDATE "user" SET role = $1 WHERE email = $2',
                    ['admin', 'supertest@example.com']
                );

                console.log('✅ Role updated to "admin"');
            } else {
                console.log('\n✅ User already has "admin" role');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkUser();
