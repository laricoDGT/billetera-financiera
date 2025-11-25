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
    const { id, amount } = body;

    if (!id || !amount) {
      return new Response(
        JSON.stringify({ error: "ID y monto son requeridos" }),
        { status: 400 }
      );
    }

    // Verify ownership and get current remaining amount
    const check = await query(
      "SELECT remaining_amount FROM financial_debts WHERE id = $1 AND user_id = $2",
      [id, session.user.id]
    );

    if (check.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Debt not found" }), {
        status: 404,
      });
    }

    const currentRemaining = parseFloat(check.rows[0].remaining_amount);
    const paymentAmount = parseFloat(amount);

    if (paymentAmount > currentRemaining) {
      return new Response(
        JSON.stringify({ error: "El monto a pagar excede la deuda restante" }),
        { status: 400 }
      );
    }

    const newRemaining = currentRemaining - paymentAmount;

    const result = await query(
      `UPDATE financial_debts 
       SET remaining_amount = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [newRemaining, id, session.user.id]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(JSON.stringify({ error: "Error processing payment" }), {
      status: 500,
    });
  }
};
