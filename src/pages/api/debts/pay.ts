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
    const { id, amount, account_id } = body;

    if (!id || !amount || !account_id) {
      return new Response(
        JSON.stringify({ error: "ID, monto y cuenta son requeridos" }),
        { status: 400 }
      );
    }

    // Verify ownership and get current remaining amount
    const check = await query(
      "SELECT name, type, remaining_amount FROM financial_debts WHERE id = $1 AND user_id = $2",
      [id, session.user.id]
    );

    if (check.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Debt not found" }), {
        status: 404,
      });
    }

    const debt = check.rows[0];
    const currentRemaining = parseFloat(debt.remaining_amount);
    const paymentAmount = parseFloat(amount);

    if (paymentAmount > currentRemaining) {
      return new Response(
        JSON.stringify({ error: "El monto a pagar excede la deuda restante" }),
        { status: 400 }
      );
    }

    const newRemaining = currentRemaining - paymentAmount;

    // Update debt
    const result = await query(
      `UPDATE financial_debts 
       SET remaining_amount = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [newRemaining, id, session.user.id]
    );

    // Create transaction record
    const transactionType = debt.type === "receivable" ? "Ingreso" : "Gasto";
    const description = `Pago de deuda: ${debt.name}`;

    await query(
      `INSERT INTO financial_transactions (user_id, account_id, type, amount, category, description, date)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        session.user.id,
        account_id,
        transactionType,
        paymentAmount,
        "Deudas",
        description,
      ]
    );

    // Update account balance
    const balanceChange =
      transactionType === "Ingreso" ? paymentAmount : -paymentAmount;
    await query(
      `UPDATE financial_accounts 
         SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 AND user_id = $3`,
      [balanceChange, account_id, session.user.id]
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
