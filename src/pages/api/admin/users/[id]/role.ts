import type { APIRoute } from "astro";
import { auth } from "../../../../../lib/auth";

export const PATCH: APIRoute = async ({ params, request }) => {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user || (session.user as any).role !== 'admin') {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { role } = await request.json();
        const userId = params.id;

        if (!userId) {
            return new Response(JSON.stringify({ error: "User ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Validate role
        const validRoles = ['user', 'admin'];
        if (!validRoles.includes(role)) {
            return new Response(JSON.stringify({ error: "Invalid role" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Update user role using Better Auth admin
        await auth.api.setRole({
            userId,
            role,
            headers: request.headers
        });

        return new Response(JSON.stringify({ success: true, role }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error updating role:", error);
        return new Response(JSON.stringify({
            error: "Failed to update role",
            details: error instanceof Error ? error.message : "Unknown error"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
