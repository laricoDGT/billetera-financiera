
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
