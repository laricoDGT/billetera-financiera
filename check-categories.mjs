import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkCategories() {
    try {
        console.log('Checking for duplicate categories...\n');

        const result = await pool.query(`
            SELECT name, COUNT(*) as count, array_agg(id) as ids
            FROM financial_categories
            GROUP BY name
            HAVING COUNT(*) > 1
        `);

        if (result.rows.length === 0) {
            console.log('✅ No duplicate categories found.');
        } else {
            console.log(`Found ${result.rows.length} duplicate categories:\n`);
            result.rows.forEach(row => {
                console.log(`- "${row.name}": ${row.count} entries (IDs: ${row.ids.join(', ')})`);
            });
        }

        // Also check if categories are user-specific
        console.log('\nChecking table structure for user_id...');
        const schema = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'financial_categories'
        `);
        console.log('Columns:', schema.rows.map(r => r.column_name).join(', '));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkCategories();
