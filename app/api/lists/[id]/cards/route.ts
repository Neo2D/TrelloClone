import { NextResponse, NextRequest } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/types";

// GET todas las cards de una lista específica
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const listId = Number(resolvedParams.id);
    if (Number.isNaN(listId)) {
      return NextResponse.json({ error: "ID de lista inválido" }, { status: 400 });
    }

    const cards = await sql`
      SELECT id, title, description, position, list_id
      FROM cards
      WHERE list_id = ${listId}
      ORDER BY position ASC
    `;
    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json({ error: "Error fetching cards" }, { status: 500 });
  }
}

// POST crear nueva card en una lista
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(req);
    const resolvedParams = await params;
    const listId = Number(resolvedParams.id);
    if (Number.isNaN(listId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { title, description } = await req.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Título requerido" }, { status: 400 });
    }

    // Permisos: dueño del workspace de esa lista
    const owner = await sql<{ owner_id: number }[]>`
      SELECT w.owner_id
      FROM lists l
      JOIN boards b ON l.board_id = b.id
      JOIN workspaces w ON b.workspace_id = w.id
      WHERE l.id = ${listId}
    `;
    if (owner.length === 0) return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });
    if (owner[0].owner_id !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    // Siguiente posición al final
    const [{ next_position }] = await sql<{ next_position: number }[]>`
      SELECT COALESCE(MAX(position), -1) + 1 AS next_position
      FROM cards
      WHERE list_id = ${listId}
    `;

    const [card] = await sql<Card[]>`
      INSERT INTO cards (title, description, position, list_id)
      VALUES (${title}, ${description ?? null}, ${next_position}, ${listId})
      RETURNING id, title, description, position, list_id
    `;

    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthenticated") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Error creando card:", err);
    return NextResponse.json({ error: "Error creando card" }, { status: 500 });
  }
}
