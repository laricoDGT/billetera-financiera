import type { APIRoute } from "astro";
import { auth } from "../../lib/auth";
import { query } from "../../lib/db";

export const GET: APIRoute = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    try {
        const result = await query(
            "SELECT * FROM user_invoice_settings WHERE user_id = $1",
            [session.user.id]
        );

        if (result.rows.length === 0) {
            return new Response(JSON.stringify({}), { status: 200 });
        }

        return new Response(JSON.stringify(result.rows[0]), { status: 200 });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
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
        });
    }

    try {
        const body = await request.json();
        const {
            first_name,
            last_name,
            email,
            phone,
            address,
            default_invoice_for,
            default_client_name,
        } = body;

        // Check if settings exist
        const check = await query(
            "SELECT * FROM user_invoice_settings WHERE user_id = $1",
            [session.user.id]
        );

        if (check.rows.length > 0) {
            // Update
            await query(
                `UPDATE user_invoice_settings 
         SET first_name = $1, last_name = $2, email = $3, phone = $4, address = $5, default_invoice_for = $6, default_client_name = $7, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $8`,
                [
                    first_name,
                    last_name,
                    email,
                    phone,
                    address,
                    default_invoice_for,
                    default_client_name,
                    session.user.id,
                ]
            );
        } else {
            // Insert
            await query(
                `INSERT INTO user_invoice_settings 
         (user_id, first_name, last_name, email, phone, address, default_invoice_for, default_client_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    session.user.id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    address,
                    default_invoice_for,
                    default_client_name,
                ]
            );
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error("Error saving settings:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
        });
    }
};
