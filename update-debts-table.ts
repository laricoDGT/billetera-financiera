import { query } from "./src/lib/db";

async function updateDebtsTable() {
  try {
    console.log("Updating financial_debts table...");

    // Add type column (payable = I owe, receivable = They owe me)
    await query(`
      ALTER TABLE financial_debts 
      ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'payable',
      ADD COLUMN IF NOT EXISTS term INTEGER, -- Number of months/installments
      ADD COLUMN IF NOT EXISTS installment_amount DECIMAL(10, 2);
    `);

    console.log("Table updated successfully");
  } catch (error) {
    console.error("Error updating table:", error);
  }
}

updateDebtsTable();
