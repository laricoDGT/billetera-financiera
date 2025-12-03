
import { query } from "../lib/db";

async function createNotesTable() {
    try {
        console.log("Creating notes table...");
        await query(`
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT,
                category TEXT,
                link TEXT,
                content TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Table 'notes' created successfully.");
    } catch (e) {
        console.error("Error creating notes table:", e);
    }
}

createNotesTable();
