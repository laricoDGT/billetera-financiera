
import { query } from "../lib/db";

async function listTables() {
    try {
        const result = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log("Tables:", result.rows.map(r => r.table_name));
    } catch (e) {
        console.error(e);
    }
}

listTables();
