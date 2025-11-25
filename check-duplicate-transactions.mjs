import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDuplicates() {
    try {
        console.log('Checking for duplicate transactions...\n');

        // Find transactions with same description, amount, and date
        const result = await pool.query(`
            SELECT 
                description,
                amount,
                date,
                type,
                COUNT(*) as count,
                array_agg(id) as transaction_ids
            FROM financial_transactions
            GROUP BY description, amount, date, type
            HAVING COUNT(*) > 1
            ORDER BY date DESC
        `);

        if (result.rows.length === 0) {
            console.log('✅ No duplicate transactions found.');
        } else {
            console.log(`Found ${result.rows.length} sets of duplicate transactions:\n`);
            result.rows.forEach((row, index) => {
                console.log(`${index + 1}. "${row.description}" - ${row.type} - $${row.amount}`);
                console.log(`   Date: ${new Date(row.date).toLocaleDateString()}`);
                console.log(`   Count: ${row.count} duplicates`);
                console.log(`   IDs: ${row.transaction_ids.join(', ')}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkDuplicates();
