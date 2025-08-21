import { NextResponse, NextRequest } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// PATCH actualizar una card por id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(req);
    const resolvedParams = await params;
    const cardId = Number(resolvedParams.id);
    if (Number.isNaN(cardId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, position, list_id } = body;

    // Simple check if card exists
    const [cardExists] = await sql`
      SELECT id FROM cards WHERE id = ${cardId}
    `;

    if (!cardExists) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = $' + (values.length + 2));
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = $' + (values.length + 2));
      values.push(description);
    }
    if (position !== undefined) {
      updates.push('position = $' + (values.length + 2));
      values.push(position);
    }
    if (list_id !== undefined) {
      updates.push('list_id = $' + (values.length + 2));
      values.push(list_id);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const query = `
      UPDATE cards
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, title, description, position, list_id
    `;

    const [updatedCard] = await sql.unsafe(query, [cardId, ...values]);

    if (!updatedCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json({ error: "Error updating card" }, { status: 500 });
  }
}

// DELETE eliminar una card por id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(req);
    const resolvedParams = await params;
    const cardId = Number(resolvedParams.id);
    if (Number.isNaN(cardId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Simple check if card exists
    const [cardExists] = await sql`
      SELECT id FROM cards WHERE id = ${cardId}
    `;

    if (!cardExists) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const [deletedCard] = await sql`
      DELETE FROM cards
      WHERE id = ${cardId}
      RETURNING id, title, description, position, list_id
    `;

    if (!deletedCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json({ error: "Error deleting card" }, { status: 500 });
  }
}