import type { APIRoute } from "astro";
import { query } from "../../../../lib/db";
import { auth } from "../../../../lib/auth";

export const GET: APIRoute = async ({ params, request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { id } = params;

    if (!id) {
        return new Response(JSON.stringify({ error: "Reminder ID is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        // Verify reminder belongs to user
        const reminderCheck = await query(
            'SELECT id FROM reminders WHERE id = $1 AND user_id = $2',
            [id, session.user.id]
        );

        if (reminderCheck.rows.length === 0) {
            return new Response(JSON.stringify({ error: "Reminder not found or unauthorized" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch payment history
        const result = await query(
            'SELECT * FROM reminder_payments WHERE reminder_id = $1 ORDER BY paid_date DESC',
            [id]
        );

        return new Response(JSON.stringify(result.rows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error fetching payment history:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
