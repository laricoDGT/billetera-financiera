import { pool } from "./src/lib/db.ts";

async function createTransactionsTable() {
  try {
    const client = await pool.connect();
    console.log("Connected to DB");

    await client.query(`
            CREATE TABLE IF NOT EXISTS financial_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
                type TEXT NOT NULL, -- 'income' or 'expense'
                amount DECIMAL(15, 2) NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

    console.log("Table 'financial_transactions' created successfully.");
    client.release();
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await pool.end();
  }
}

createTransactionsTable();
