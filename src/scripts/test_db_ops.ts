
import { query } from "../lib/db";

async function test() {
    try {
        // Get a user
        const userRes = await query('SELECT id FROM "user" LIMIT 1');
        if (userRes.rows.length === 0) {
            console.log("No users found");
            return;
        }
        const userId = userRes.rows[0].id;
        console.log("Using user ID:", userId);

        // Insert invoice
        const insertRes = await query(`
            INSERT INTO financial_invoices (user_id, client_name, amount, issue_date, status, invoice_number)
            VALUES ($1, 'Test Client', 100, '2023-01-01', 'pending', 'TEST-001')
            RETURNING id
        `, [userId]);
        const invoiceId = insertRes.rows[0].id;
        console.log("Inserted invoice ID:", invoiceId);

        // Verify existence
        const checkRes = await query("SELECT * FROM financial_invoices WHERE id = $1", [invoiceId]);
        console.log("Invoice exists:", checkRes.rows.length > 0);

        // Delete invoice
        const deleteRes = await query("DELETE FROM financial_invoices WHERE id = $1 RETURNING id", [invoiceId]);
        console.log("Deleted rows:", deleteRes.rowCount);

        // Verify deletion
        const checkRes2 = await query("SELECT * FROM financial_invoices WHERE id = $1", [invoiceId]);
        console.log("Invoice exists after delete:", checkRes2.rows.length > 0);

    } catch (e) {
        console.error(e);
    }
}

test();
