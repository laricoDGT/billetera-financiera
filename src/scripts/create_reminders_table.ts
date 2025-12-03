import { query } from "../lib/db";

async function createRemindersTable() {
    try {
        await query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        amount DECIMAL(10, 2) DEFAULT 0,
        due_date DATE NOT NULL,
        frequency TEXT DEFAULT 'once',
        is_paid BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("Table reminders created successfully");
    } catch (error) {
        console.error("Error creating table:", error);
    }
}

createRemindersTable();
