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
    const {
      client_name,
      amount,
      issue_date,
      due_date,
      invoice_number,
      items,
      notes,
      tax_rate,
    } = body;

    if (!client_name || !amount || !issue_date) {
      return new Response(
        JSON.stringify({
          error: "Cliente, monto y fecha de emisión son requeridos",
        }),
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO financial_invoices (user_id, client_name, amount, issue_date, due_date, status, invoice_number, items, notes, tax_rate)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9)
       RETURNING *`,
      [
        session.user.id,
        client_name,
        amount,
        issue_date,
        due_date || null,
        invoice_number || null,
        JSON.stringify(items || []),
        notes || null,
        tax_rate || 0,
      ]
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
    const {
      id,
      client_name,
      amount,
      issue_date,
      due_date,
      status,
      invoice_number,
      items,
      notes,
      tax_rate,
    } = body;

    const queryId = url.searchParams.get("id");
    const invoiceId = id || queryId;

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
      });
    }

    // Verify ownership
    const check = await query(
      "SELECT id FROM financial_invoices WHERE id = $1 AND user_id = $2",
      [invoiceId, session.user.id]
    );

    if (check.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
      });
    }

    const result = await query(
      `UPDATE financial_invoices 
       SET client_name = $1, amount = $2, issue_date = $3, due_date = $4, status = $5, invoice_number = $6, items = $7, notes = $8, tax_rate = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        client_name,
        amount,
        issue_date,
        due_date || null,
        status,
        invoice_number || null,
        JSON.stringify(items || []),
        notes || null,
        tax_rate || 0,
        invoiceId,
        session.user.id,
      ]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return new Response(JSON.stringify({ error: "Error updating invoice" }), {
      status: 500,
    });
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  console.log("DELETE /api/invoices request received");
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    console.log("DELETE /api/invoices: No session");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const id = url.searchParams.get("id");
    console.log(`DELETE /api/invoices: Attempting to delete invoice ${id} for user ${session.user.id}`);

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
      });
    }

    const result = await query(
      "DELETE FROM financial_invoices WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, session.user.id]
    );

    console.log(`DELETE /api/invoices: Deleted ${result.rowCount} rows`);

    if (result.rowCount === 0) {
      // Check if invoice exists at all to give better error
      const check = await query("SELECT id FROM financial_invoices WHERE id = $1", [id]);
      if (check.rows.length > 0) {
        console.log("DELETE /api/invoices: Invoice exists but belongs to another user");
        return new Response(JSON.stringify({ error: "Invoice not found (permission denied)" }), {
          status: 404,
        });
      }
      console.log("DELETE /api/invoices: Invoice not found");
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return new Response(JSON.stringify({ error: "Error deleting invoice" }), {
      status: 500,
    });
  }
};
