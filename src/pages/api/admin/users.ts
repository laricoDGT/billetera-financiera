import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";

export const GET: APIRoute = async ({ request }) => {
    try {
        // Get session to verify admin access
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user || (session.user as any).role !== 'superadmin') {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Get query parameters
        const url = new URL(request.url);
        const search = url.searchParams.get("search") || "";
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        // Use Better Auth admin plugin to list users
        const result = await auth.api.listUsers({
            query: {
                search,
                limit,
                offset,
                sortBy: "createdAt",
                sortDirection: "desc"
            },
            headers: request.headers
        });

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error listing users:", error);
        return new Response(JSON.stringify({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
