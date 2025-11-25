import { Pool } from 'pg';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkRecentTransactions() {
    try {
        console.log('Fetching recent transactions for supertest@example.com...\n');

        // Get user ID first
        const userResult = await pool.query(
            'SELECT id FROM "user" WHERE email = $1',
            ['supertest@example.com']
        );

        if (userResult.rows.length === 0) {
            console.log('User not found');
            return;
        }

        const userId = userResult.rows[0].id;
        console.log(`User ID: ${userId}\n`);

        // Run the same query as dashboard.astro
        const result = await pool.query(`
            SELECT t.*, c.icon as category_icon, a.name as account_name 
            FROM financial_transactions t
            LEFT JOIN financial_categories c ON t.category = c.name
            JOIN financial_accounts a ON t.account_id = a.id
            WHERE t.user_id = $1
            ORDER BY t.date DESC
            LIMIT 5
        `, [userId]);

        console.log(`Found ${result.rows.length} transactions:\n`);
        result.rows.forEach((t, index) => {
            console.log(`${index + 1}. ${t.description || t.category} - ${t.type} - $${t.amount}`);
            console.log(`   ID: ${t.id}`);
            console.log(`   Date: ${new Date(t.date).toLocaleDateString()}`);
            console.log(`   Account: ${t.account_name}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkRecentTransactions();
