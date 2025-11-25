import type { APIRoute } from "astro";
import { query } from "../../../lib/db";
import { auth } from "../../../lib/auth";

export const prerender = false;

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
    const { name, total_amount, due_date, type, term, installment_amount } =
      body;

    if (!name || !total_amount) {
      return new Response(
        JSON.stringify({ error: "Nombre y monto son requeridos" }),
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO financial_debts (user_id, name, total_amount, remaining_amount, due_date, type, term, installment_amount)
       VALUES ($1, $2, $3, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        session.user.id,
        name,
        total_amount,
        due_date || null,
        type || "payable",
        term || null,
        installment_amount || null,
      ]
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

export const PUT: APIRoute = async ({ request, url }) => {
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
    const { id, name, total_amount, due_date, type, term, installment_amount } =
      body;

    const queryId = url.searchParams.get("id");
    const debtId = id || queryId;

    if (!debtId) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
      });
    }

    // Verify ownership
    const check = await query(
      "SELECT id FROM financial_debts WHERE id = $1 AND user_id = $2",
      [debtId, session.user.id]
    );

    if (check.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Debt not found" }), {
        status: 404,
      });
    }

    const result = await query(
      `UPDATE financial_debts 
       SET name = $1, total_amount = $2, due_date = $3, type = $4, term = $5, installment_amount = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        name,
        total_amount,
        due_date || null,
        type,
        term || null,
        installment_amount || null,
        debtId,
        session.user.id,
      ]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating debt:", error);
    return new Response(JSON.stringify({ error: "Error updating debt" }), {
      status: 500,
    });
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
      });
    }

    const result = await query(
      "DELETE FROM financial_debts WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, session.user.id]
    );

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: "Debt not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting debt:", error);
    return new Response(JSON.stringify({ error: "Error deleting debt" }), {
      status: 500,
    });
  }
};
