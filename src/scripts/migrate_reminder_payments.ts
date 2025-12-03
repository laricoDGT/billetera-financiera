import { query } from '../lib/db';

async function createReminderPaymentsTable() {
    try {
        // Create reminder_payments table
        await query(`
            CREATE TABLE IF NOT EXISTS reminder_payments (
                id SERIAL PRIMARY KEY,
                reminder_id INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                due_date DATE NOT NULL,
                paid_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Table reminder_payments created successfully');

        // Create index for faster queries
        await query(`
            CREATE INDEX IF NOT EXISTS idx_reminder_payments_reminder_id 
            ON reminder_payments(reminder_id);
        `);
        console.log('✅ Index created on reminder_payments');

        // Add last_paid_date column to reminders table
        await query(`
            ALTER TABLE reminders 
            ADD COLUMN IF NOT EXISTS last_paid_date DATE;
        `);
        console.log('✅ Added last_paid_date column to reminders');

    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
}

async function migrateExistingData() {
    try {
        // Find all paid reminders
        const paidReminders = await query(`
            SELECT id, user_id, amount, due_date, frequency, updated_at, is_paid
            FROM reminders 
            WHERE is_paid = true
        `);

        console.log(`Found ${paidReminders.rows.length} paid reminders to migrate`);

        for (const reminder of paidReminders.rows) {
            // Create payment record
            await query(`
                INSERT INTO reminder_payments (reminder_id, user_id, amount, due_date, paid_date)
                VALUES ($1, $2, $3, $4, $5)
            `, [reminder.id, reminder.user_id, reminder.amount, reminder.due_date, reminder.updated_at]);

            // Calculate next due date for recurring reminders
            if (reminder.frequency !== 'once') {
                const nextDueDate = calculateNextDueDate(new Date(reminder.due_date), reminder.frequency);

                await query(`
                    UPDATE reminders 
                    SET due_date = $1, last_paid_date = $2, is_paid = false
                    WHERE id = $3
                `, [nextDueDate, reminder.due_date, reminder.id]);
            } else {
                // For one-time reminders, set as inactive
                await query(`
                    UPDATE reminders 
                    SET is_active = false, last_paid_date = $1
                    WHERE id = $2
                `, [reminder.due_date, reminder.id]);
            }
        }

        console.log('✅ Migration completed successfully');

    } catch (error) {
        console.error('❌ Error migrating data:', error);
        throw error;
    }
}

function calculateNextDueDate(currentDueDate: Date, frequency: string): Date {
    const next = new Date(currentDueDate);

    switch (frequency) {
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
        case 'yearly':
            next.setFullYear(next.getFullYear() + 1);
            break;
        default:
            return currentDueDate;
    }

    return next;
}

async function main() {
    console.log('🚀 Starting reminder_payments table creation and migration...');

    await createReminderPaymentsTable();
    await migrateExistingData();

    console.log('✅ All done!');
    process.exit(0);
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
