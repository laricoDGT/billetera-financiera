import { query } from "./src/lib/db";

async function updateInvoicesTable() {
  try {
    console.log("Updating financial_invoices table...");

    await query(`
      ALTER TABLE financial_invoices 
      ADD COLUMN IF NOT EXISTS invoice_number TEXT,
      ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 0;
    `);

    console.log("Table updated successfully");
  } catch (error) {
    console.error("Error updating table:", error);
  }
}

updateInvoicesTable();
