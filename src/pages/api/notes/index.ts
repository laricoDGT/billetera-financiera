
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
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
            [session.user.id]
        );
        return new Response(JSON.stringify(result.rows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching notes:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const POST: APIRoute = async ({ request, redirect }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        // For Share Target (POST from other apps), we might not have a session cookie if not logged in browser.
        // But for now, let's assume the user is logged in or we redirect to login.
        // If it's a form post (Share Target), we should redirect to login page if not auth.
        const contentType = request.headers.get("content-type");
        if (contentType?.includes("multipart/form-data") || contentType?.includes("application/x-www-form-urlencoded")) {
            return redirect("/login");
        }

        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        let title, category, link, content;
        const contentType = request.headers.get("content-type");

        if (contentType?.includes("application/json")) {
            const body = await request.json();
            title = body.title;
            category = body.category;
            link = body.link;
            content = body.content;
        } else if (contentType?.includes("multipart/form-data") || contentType?.includes("application/x-www-form-urlencoded")) {
            const formData = await request.formData();
            title = formData.get("title")?.toString() || formData.get("name")?.toString(); // 'name' is often used by Share Target for title
            category = formData.get("category")?.toString();
            link = formData.get("link")?.toString() || formData.get("url")?.toString() || formData.get("text")?.toString(); // 'text' often contains URL in shares
            content = formData.get("content")?.toString() || formData.get("description")?.toString() || formData.get("text")?.toString();

            // If link is in content/text, try to extract it
            if (!link && content && (content.startsWith("http://") || content.startsWith("https://"))) {
                link = content;
            }
        }

        await query(
            'INSERT INTO notes (user_id, title, category, link, content) VALUES ($1, $2, $3, $4, $5)',
            [session.user.id, title || "Sin título", category || "General", link, content]
        );

        // If it's a form submission (Share Target), redirect to the notes page
        if (contentType?.includes("multipart/form-data") || contentType?.includes("application/x-www-form-urlencoded")) {
            return redirect("/notes");
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error creating note:", error);
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
        const { id, title, category, link, content } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: "Note ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Update the note, ensuring it belongs to the current user
        const result = await query(
            'UPDATE notes SET title = $1, category = $2, link = $3, content = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
            [title, category, link, content, id, session.user.id]
        );

        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: "Note not found or unauthorized" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true, note: result.rows[0] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error updating note:", error);
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
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return new Response(JSON.stringify({ error: "Note IDs are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Delete notes, ensuring they belong to the current user
        const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
        const result = await query(
            `DELETE FROM notes WHERE id IN (${placeholders}) AND user_id = $1 RETURNING id`,
            [session.user.id, ...ids]
        );

        return new Response(JSON.stringify({ success: true, deletedCount: result.rows.length }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error deleting notes:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
