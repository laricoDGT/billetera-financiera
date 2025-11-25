import type { APIRoute } from "astro";
import { query } from "../../../lib/db";
import { auth } from "../../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  console.log("POST /api/invoices called");
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    console.log("Session not found in /api/invoices");
    const authHeader = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie");
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        details: {
          hasAuth: !!authHeader,
          hasCookie: !!cookieHeader,
        },
      }),
      {
        status: 401,
      }
    );
  }

  try {
    const body = await request.json();
    const { client_name, amount, issue_date, due_date } = body;

    if (!client_name || !amount || !issue_date) {
      return new Response(
        JSON.stringify({
          error: "Cliente, monto y fecha de emisión son requeridos",
        }),
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO financial_invoices (user_id, client_name, amount, issue_date, due_date, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [session.user.id, client_name, amount, issue_date, due_date || null]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return new Response(JSON.stringify({ error: "Error creating invoice" }), {
      status: 500,
    });
  }
};
