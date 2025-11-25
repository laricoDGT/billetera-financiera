import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { query } from "../../../lib/db";

export const GET: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await query(
      "SELECT * FROM financial_accounts WHERE user_id = $1 ORDER BY created_at DESC",
      [session.user.id]
    );
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {


  // Log headers for debugging
  const cookieHeader = request.headers.get("cookie");
  const authHeader = request.headers.get("authorization");
  console.log("Cookie Header:", cookieHeader ? "Present" : "Missing");
  console.log("Auth Header:", authHeader ? "Present" : "Missing");

  try {
    // Try to get session from headers (handles both Cookie and Bearer)
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      console.log("No session found via auth.api.getSession");
      return new Response(JSON.stringify({ error: "No has iniciado sesión" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log("Session found for user:", session.user.id);

    const body = await request.json();
    console.log("Request body:", body);
    const { name, type, balance } = body;

    if (!name || !type) {
      console.log("Missing fields");
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos (Nombre o Tipo)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Executing query...");
    const balanceNum = parseFloat(balance) || 0;

    const result = await query(
      `INSERT INTO financial_accounts (user_id, name, type, balance) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
      [session.user.id, name, type, balanceNum]
    );
    console.log("Query successful, result:", result.rows[0]);

    return new Response(JSON.stringify(result.rows[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in POST /api/accounts:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
