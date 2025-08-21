import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req);
    const boardId = Number(params.id);
    if (Number.isNaN(boardId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const { listOrder }: { listOrder: number[] } = await req.json();

    // Actualizar posiciones de listas según el array
    for (let i = 0; i < listOrder.length; i++) {
      await sql`UPDATE lists SET position = ${i} WHERE id = ${listOrder[i]} AND board_id = ${boardId}`;
    }

    return NextResponse.json({ message: "Posiciones de listas actualizadas" });
  } catch (err) {
    console.error("Error actualizando posiciones de listas:", err);
    return NextResponse.json({ error: "Error actualizando posiciones" }, { status: 500 });
  }
}
