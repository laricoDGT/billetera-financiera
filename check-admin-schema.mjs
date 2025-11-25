import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkAdminSchema() {
    try {
        console.log('Checking for admin plugin tables and columns...\n');

        // Check if role table exists
        const roleTableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'role'
            );
        `);
        console.log('Role table exists:', roleTableCheck.rows[0].exists);

        // Check if permission table exists
        const permissionTableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'permission'
            );
        `);
        console.log('Permission table exists:', permissionTableCheck.rows[0].exists);

        // Check user table columns
        const userColumns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user'
            ORDER BY ordinal_position;
        `);
        console.log('\nUser table columns:');
        userColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });

        // Check if user has role column
        const hasRoleColumn = userColumns.rows.some(col => col.column_name === 'role');
        console.log('\nUser table has "role" column:', hasRoleColumn);

        if (!hasRoleColumn) {
            console.log('\n⚠️  WARNING: User table is missing "role" column!');
            console.log('The admin plugin requires this column.');
            console.log('Run: npx @better-auth/cli migrate');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkAdminSchema();
