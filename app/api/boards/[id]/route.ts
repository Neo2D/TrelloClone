import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET obtener un board por id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(req);
    const resolvedParams = await params;
    const boardId = Number(resolvedParams.id);
    if (Number.isNaN(boardId)) {
      return NextResponse.json({ error: "ID de board inválido" }, { status: 400 });
    }

    // Obtener board con verificación de permisos
    const [board] = await sql`
      SELECT boards.id, boards.name, boards.workspace_id, workspaces.owner_id
      FROM boards
      JOIN workspaces ON boards.workspace_id = workspaces.id
      WHERE boards.id = ${boardId}
    `;

    if (!board) {
      return NextResponse.json({ error: "Board no encontrado" }, { status: 404 });
    }

    if (board.owner_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Devolver solo los datos del board (sin owner_id por seguridad)
    return NextResponse.json({
      id: board.id,
      name: board.name,
      workspace_id: board.workspace_id
    });
  } catch (err) {
    if ((err as Error).message === "Unauthenticated") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Error obteniendo board:", err);
    return NextResponse.json({ error: "Error obteniendo board" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const user = requireAuth(req);
      const resolvedParams = await params;
      const boardId = Number(resolvedParams.id);
      if (Number.isNaN(boardId)) {
        return NextResponse.json({ error: "ID de board inválido" }, { status: 400 });
      }
  
      const { name } = await req.json();
  
      if (!name || typeof name !== "string") {
        return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });
      }
  
      // Verificar que el usuario es dueño del workspace al que pertenece el board
      const [board] = await sql`
        SELECT boards.id, boards.name, boards.workspace_id, workspaces.owner_id
        FROM boards
        JOIN workspaces ON boards.workspace_id = workspaces.id
        WHERE boards.id = ${boardId}
      `;
  
      if (!board || board.owner_id !== user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
  
      // Actualizar
      const [updatedBoard] = await sql`
        UPDATE boards SET name = ${name} WHERE id = ${boardId} RETURNING id, name, workspace_id
      `;
  
      return NextResponse.json(updatedBoard);
    } catch (err) {
      if ((err as Error).message === "Unauthenticated") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      console.error("Error actualizando board:", err);
      return NextResponse.json({ error: "Error actualizando board" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const user = requireAuth(req);
      const resolvedParams = await params;
      const boardId = Number(resolvedParams.id);
      if (Number.isNaN(boardId)) {
        return NextResponse.json({ error: "ID de board inválido" }, { status: 400 });
      }
  
      // Verificar que el usuario es dueño del workspace
      const [board] = await sql`
        SELECT boards.id, workspaces.owner_id
        FROM boards
        JOIN workspaces ON boards.workspace_id = workspaces.id
        WHERE boards.id = ${boardId}
      `;
  
      if (!board || board.owner_id !== user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
  
      // Eliminar board (ON DELETE CASCADE elimina listas y cartas)
      await sql`
        DELETE FROM boards WHERE id = ${boardId}
      `;
  
      return NextResponse.json({ message: "Board eliminado" });
    } catch (err) {
      if ((err as Error).message === "Unauthenticated") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      console.error("Error eliminando board:", err);
      return NextResponse.json({ error: "Error eliminando board" }, { status: 500 });
    }
}