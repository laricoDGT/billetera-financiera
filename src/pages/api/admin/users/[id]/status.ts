import type { APIRoute } from "astro";
import { auth } from "../../../../../lib/auth";

export const PATCH: APIRoute = async ({ params, request }) => {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user || (session.user as any).role !== 'superadmin') {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { banned } = await request.json();
        const userId = params.id;

        if (!userId) {
            return new Response(JSON.stringify({ error: "User ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (typeof banned !== 'boolean') {
            return new Response(JSON.stringify({ error: "Banned must be a boolean" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Ban/unban user using Better Auth admin
        if (banned) {
            await auth.api.banUser({
                userId,
                headers: request.headers
            });
        } else {
            await auth.api.unbanUser({
                userId,
                headers: request.headers
            });
        }

        return new Response(JSON.stringify({ success: true, banned }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error updating user status:", error);
        return new Response(JSON.stringify({
            error: "Failed to update user status",
            details: error instanceof Error ? error.message : "Unknown error"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
