
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
        const { id, title, amount, due_date, frequency, is_paid } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: "Reminder ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Build dynamic query based on provided fields
        // For simplicity, we'll update all fields if provided, or just specific ones if we were building a more complex builder.
        // But here we can assume the client sends the full object or we handle partial updates.
        // Let's handle specific "mark as paid" vs "edit details" logic if needed, but a generic update is fine.

        // If is_paid is explicitly provided, we update it.
        // If other fields are provided, we update them.

        let result;
        if (is_paid !== undefined && title === undefined) {
            // Just updating status
            result = await query(
                'UPDATE reminders SET is_paid = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
                [is_paid, id, session.user.id]
            );
        } else {
            // Full update
            result = await query(
                'UPDATE reminders SET title = $1, amount = $2, due_date = $3, frequency = $4, is_paid = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
                [title, amount, due_date, frequency, is_paid !== undefined ? is_paid : false, id, session.user.id]
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
