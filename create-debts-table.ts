import { query } from "./src/lib/db";

async function createDebtsTable() {
  try {
    console.log("Creating financial_debts table...");
    await query(`
      CREATE TABLE IF NOT EXISTS financial_debts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        remaining_amount DECIMAL(10, 2) NOT NULL,
        interest_rate DECIMAL(5, 2),
        due_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table created successfully");
  } catch (error) {
    console.error("Error creating table:", error);
  }
}

createDebtsTable();
