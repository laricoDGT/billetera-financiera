import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { query, pool } from "../../../lib/db";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Join with accounts to get account name if needed, or just fetch raw
    const result = await query(
      `SELECT t.*, a.name as account_name 
             FROM financial_transactions t
             LEFT JOIN financial_accounts a ON t.account_id = a.id
             WHERE t.user_id = $1 
             ORDER BY t.date DESC`,
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

export const POST: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response(JSON.stringify({ error: "No has iniciado sesión" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { type, amount, category, description, account_id, date } = body;

    if (!type || !amount || !category || !account_id) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Insert Transaction
      const insertResult = await client.query(
        `INSERT INTO financial_transactions (user_id, account_id, type, amount, category, description, date) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 RETURNING *`,
        [
          session.user.id,
          account_id,
          type,
          amount,
          category,
          description,
          date || new Date(),
        ]
      );

      // 2. Update Account Balance
      const amountNum = parseFloat(amount);
      const balanceChange = type === "Ingreso" ? amountNum : -amountNum;

      await client.query(
        `UPDATE financial_accounts 
                 SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $2 AND user_id = $3`,
        [balanceChange, account_id, session.user.id]
      );

      await client.query("COMMIT");

      return new Response(JSON.stringify(insertResult.rows[0]), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
