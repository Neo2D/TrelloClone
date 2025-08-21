import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req);
    const listId = Number(params.id);
    if (Number.isNaN(listId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const { cards }: { cards: { id: number; position: number; list_id: number }[] } = await req.json();

    for (const card of cards) {
      await sql`
        UPDATE cards
        SET position = ${card.position}, list_id = ${card.list_id}
        WHERE id = ${card.id} AND list_id = ${listId}
      `;
    }

    return NextResponse.json({ message: "Posiciones de cartas actualizadas" });
  } catch (err) {
    console.error("Error actualizando posiciones de cartas:", err);
    return NextResponse.json({ error: "Error actualizando posiciones" }, { status: 500 });
  }
}
