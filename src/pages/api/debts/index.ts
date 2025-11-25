import type { APIRoute } from "astro";
import { query } from "../../../lib/db";
import { auth } from "../../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  console.log("POST /api/debts called");
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");
  console.log("Auth Header:", authHeader ? "Present" : "Missing");
  console.log("Cookie Header:", cookieHeader ? "Present" : "Missing");

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    console.log("Session not found in /api/debts");
    const authHeader = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie");
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        details: {
          hasAuth: !!authHeader,
          hasCookie: !!cookieHeader,
          authLength: authHeader ? authHeader.length : 0,
        },
      }),
      {
        status: 401,
      }
    );
  }

  try {
    const body = await request.json();
    const { name, total_amount, due_date } = body;

    if (!name || !total_amount) {
      return new Response(
        JSON.stringify({ error: "Nombre y monto son requeridos" }),
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO financial_debts (user_id, name, total_amount, remaining_amount, due_date)
       VALUES ($1, $2, $3, $3, $4)
       RETURNING *`,
      [session.user.id, name, total_amount, due_date || null]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating debt:", error);
    return new Response(JSON.stringify({ error: "Error creating debt" }), {
      status: 500,
    });
  }
};
