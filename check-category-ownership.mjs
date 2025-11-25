import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkCategoryOwnership() {
    try {
        console.log('Checking ownership of duplicate categories...\n');

        const result = await pool.query(`
            SELECT c.name, c.user_id, u.email, c.id
            FROM financial_categories c
            LEFT JOIN "user" u ON c.user_id = u.id
            WHERE c.name IN (
                SELECT name 
                FROM financial_categories 
                GROUP BY name 
                HAVING COUNT(*) > 1
            )
            ORDER BY c.name, c.user_id
        `);

        if (result.rows.length === 0) {
            console.log('No duplicates found (unexpected).');
        } else {
            console.log('Duplicate categories details:\n');
            let currentName = '';
            result.rows.forEach(row => {
                if (row.name !== currentName) {
                    console.log(`\nCategory: "${row.name}"`);
                    currentName = row.name;
                }
                console.log(`  - ID: ${row.id}`);
                console.log(`    User ID: ${row.user_id}`);
                console.log(`    User Email: ${row.email || 'NULL (Global Category?)'}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkCategoryOwnership();
