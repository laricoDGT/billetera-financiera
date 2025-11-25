import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function updateSuperadminRoles() {
    try {
        console.log('Checking for users with "superadmin" role...\n');

        // First, check if there are any superadmin users
        const checkResult = await pool.query(
            'SELECT id, email, name, role FROM "user" WHERE role = $1',
            ['superadmin']
        );

        if (checkResult.rows.length === 0) {
            console.log('✅ No users with "superadmin" role found.');
        } else {
            console.log(`Found ${checkResult.rows.length} user(s) with "superadmin" role:`);
            checkResult.rows.forEach(user => {
                console.log(`  - ${user.email} (${user.name})`);
            });

            console.log('\nUpdating all "superadmin" roles to "admin"...');

            const updateResult = await pool.query(
                'UPDATE "user" SET role = $1 WHERE role = $2 RETURNING email, name, role',
                ['admin', 'superadmin']
            );

            console.log(`\n✅ Updated ${updateResult.rows.length} user(s):`);
            updateResult.rows.forEach(user => {
                console.log(`  - ${user.email}: role is now "${user.role}"`);
            });
        }

        // Verify no superadmin roles remain
        const verifyResult = await pool.query(
            'SELECT COUNT(*) as count FROM "user" WHERE role = $1',
            ['superadmin']
        );

        console.log(`\n✅ Verification: ${verifyResult.rows[0].count} users with "superadmin" role remaining.`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

updateSuperadminRoles();
