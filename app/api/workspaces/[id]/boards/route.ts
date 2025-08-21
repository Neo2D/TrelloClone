import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(req);
    const resolvedParams = await params;
    const workspaceId = Number(resolvedParams.id);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json({ error: "ID de workspace inválido" }, { status: 400 });
    }

    // Verificar que el usuario es dueño del workspace
    const [workspace] = await sql`
      SELECT owner_id FROM workspaces WHERE id = ${workspaceId}
    `;
    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener boards
    const boards = await sql`
      SELECT id, name, workspace_id FROM boards WHERE workspace_id = ${workspaceId} ORDER BY id
    `;

    return NextResponse.json(boards);
  } catch (err) {
    console.error("Error listando boards:", err);
    return NextResponse.json({ error: "Error listando boards" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const user = requireAuth(req);
      const resolvedParams = await params;
      const workspaceId = Number(resolvedParams.id);
      if (Number.isNaN(workspaceId)) {
        return NextResponse.json({ error: "ID de workspace inválido" }, { status: 400 });
      }
  
      const { name } = await req.json();
      if (!name || typeof name !== "string") {
        return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });
      }
  
      // Verificar propiedad del workspace
      const [workspace] = await sql`
        SELECT owner_id FROM workspaces WHERE id = ${workspaceId}
      `;
      if (!workspace || workspace.owner_id !== user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
  
      // Insertar board
      const [board] = await sql`
        INSERT INTO boards (name, workspace_id) VALUES (${name}, ${workspaceId})
        RETURNING id, name, workspace_id
      `;
  
      return NextResponse.json(board, { status: 201 });
    } catch (err) {
      console.error("Error creando board:", err);
      return NextResponse.json({ error: "Error creando board" }, { status: 500 });
    }
  }
  