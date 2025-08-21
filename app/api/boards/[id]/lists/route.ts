import { NextResponse } from "next/server";
import sql from "@/lib/db";

// GET todas las listas de un board específico
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const boardId = Number(resolvedParams.id);
    if (Number.isNaN(boardId)) {
      return NextResponse.json({ error: "ID de board inválido" }, { status: 400 });
    }

    const lists = await sql`
      SELECT id, title, position, board_id
      FROM lists
      WHERE board_id = ${boardId}
      ORDER BY position ASC
    `;
    return NextResponse.json(lists);
  } catch (error) {
    console.error("Error fetching lists:", error);
    return NextResponse.json({ error: "Error fetching lists" }, { status: 500 });
  }
}

// POST crear nueva lista en un board
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const boardId = Number(resolvedParams.id);
    if (Number.isNaN(boardId)) {
      return NextResponse.json({ error: "ID de board inválido" }, { status: 400 });
    }

    const { title, position } = await req.json();
    if (!title || position == null) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const [newList] = await sql`
      INSERT INTO lists (title, position, board_id)
      VALUES (${title}, ${position}, ${boardId})
      RETURNING id, title, position, board_id
    `;
    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error("Error creating list:", error);
    return NextResponse.json({ error: "Error creating list" }, { status: 500 });
  }
}
