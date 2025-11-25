import { query } from "./src/lib/db";

async function createInvoicesTable() {
  try {
    console.log("Creating financial_invoices table...");
    await query(`
      CREATE TABLE IF NOT EXISTS financial_invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue
        issue_date DATE DEFAULT CURRENT_DATE,
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

createInvoicesTable();
