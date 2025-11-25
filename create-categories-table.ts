import { pool } from "./src/lib/db.ts";

async function createCategoriesTable() {
  try {
    const client = await pool.connect();
    console.log("Connected to DB");

    await client.query(`
            CREATE TABLE IF NOT EXISTS financial_categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                icon TEXT,
                budget DECIMAL(15, 2) DEFAULT 0,
                type TEXT DEFAULT 'expense', -- 'income' or 'expense'
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

    console.log("Table 'financial_categories' created successfully.");
    client.release();
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await pool.end();
  }
}

createCategoriesTable();
