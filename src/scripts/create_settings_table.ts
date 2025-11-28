import { query } from "../lib/db";

async function createSettingsTable() {
    try {
        await query(`
      CREATE TABLE IF NOT EXISTS user_invoice_settings (
        user_id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        default_invoice_for TEXT,
        default_client_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("Table user_invoice_settings created successfully");
    } catch (error) {
        console.error("Error creating table:", error);
    }
}

createSettingsTable();
