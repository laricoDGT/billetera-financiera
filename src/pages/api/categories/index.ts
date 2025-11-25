import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { query } from "../../../lib/db";
import { ensureCategories } from "../../../lib/categories";

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
    await ensureCategories(session.user.id);

    const result = await query(
      `SELECT * FROM financial_categories 
       WHERE user_id = $1 
       ORDER BY name ASC`,
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
    const { name, icon, budget, type } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "El nombre es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await query(
      `INSERT INTO financial_categories (user_id, name, icon, budget, type) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [session.user.id, name, icon || "📝", budget || 0, type || "expense"]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 201,
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
