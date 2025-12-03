
import type { APIRoute } from "astro";
import { query } from "../../../lib/db";
import { auth } from "../../../lib/auth";

export const GET: APIRoute = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const result = await query(
            'SELECT * FROM reminders WHERE user_id = $1 ORDER BY due_date ASC',
            [session.user.id]
        );
        return new Response(JSON.stringify(result.rows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching reminders:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const body = await request.json();
        const { title, amount, due_date, frequency } = body;

        if (!title || !due_date) {
            return new Response(JSON.stringify({ error: "Title and due date are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const result = await query(
            'INSERT INTO reminders (user_id, title, amount, due_date, frequency) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [session.user.id, title, amount || 0, due_date, frequency || 'once']
        );

        return new Response(JSON.stringify({ success: true, reminder: result.rows[0] }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error creating reminder:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const PUT: APIRoute = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const body = await request.json();
        const { id, title, amount, due_date, frequency, is_paid, payment_notes } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: "Reminder ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        let result;

        // Handle marking as paid (payment flow)
        if (is_paid === true && title === undefined) {
            // Fetch current reminder data
            const currentReminder = await query(
                'SELECT * FROM reminders WHERE id = $1 AND user_id = $2',
                [id, session.user.id]
            );

            if (currentReminder.rows.length === 0) {
                return new Response(JSON.stringify({ error: "Reminder not found or unauthorized" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const reminder = currentReminder.rows[0];

            // Create payment record
            await query(
                'INSERT INTO reminder_payments (reminder_id, user_id, amount, due_date, notes) VALUES ($1, $2, $3, $4, $5)',
                [id, session.user.id, reminder.amount, reminder.due_date, payment_notes || null]
            );

            // Handle recurrence based on frequency
            if (reminder.frequency === 'once') {
                // For one-time reminders, mark as inactive
                result = await query(
                    'UPDATE reminders SET is_active = false, last_paid_date = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
                    [reminder.due_date, id, session.user.id]
                );
            } else {
                // For recurring reminders, calculate next due date
                const currentDueDate = new Date(reminder.due_date);
                const nextDueDate = calculateNextDueDate(currentDueDate, reminder.frequency);
                const nextDueDateStr = formatDateForDB(nextDueDate);

                result = await query(
                    'UPDATE reminders SET due_date = $1, last_paid_date = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
                    [nextDueDateStr, reminder.due_date, id, session.user.id]
                );
            }
        } else {
            // Regular edit flow - update reminder details
            result = await query(
                'UPDATE reminders SET title = $1, amount = $2, due_date = $3, frequency = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
                [title, amount, due_date, frequency, id, session.user.id]
            );
        }

        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: "Reminder not found or unauthorized" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true, reminder: result.rows[0] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error updating reminder:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

// Helper functions
function calculateNextDueDate(currentDueDate: Date, frequency: string): Date {
    const next = new Date(currentDueDate);

    switch (frequency) {
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            const currentDay = currentDueDate.getDate();
            next.setMonth(next.getMonth() + 1);
            if (next.getDate() !== currentDay) {
                next.setDate(0);
            }
            break;
        case 'yearly':
            next.setFullYear(next.getFullYear() + 1);
            if (currentDueDate.getMonth() === 1 && currentDueDate.getDate() === 29) {
                if (!isLeapYear(next.getFullYear())) {
                    next.setDate(28);
                }
            }
            break;
        default:
            return currentDueDate;
    }

    return next;
}

function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function formatDateForDB(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


export const DELETE: APIRoute = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        // Parse URL to get ID if sent as query param, or body.
        // Standard REST usually uses URL params for DELETE /api/reminders/123
        // But Astro API routes often use dynamic routes [id].ts or query params.
        // Let's check if we can use body or URL search params.
        // The previous notes implementation used body with `ids` array. Let's support body `id`.

        const url = new URL(request.url);
        const idParam = url.searchParams.get("id");

        let id = idParam;

        if (!id) {
            const body = await request.json().catch(() => ({}));
            id = body.id;
        }

        if (!id) {
            return new Response(JSON.stringify({ error: "Reminder ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const result = await query(
            'DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, session.user.id]
        );

        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: "Reminder not found or unauthorized" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true, deletedId: id }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error deleting reminder:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
