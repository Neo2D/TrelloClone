// app/api/workspaces/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(req);
    const resolvedParams = await params;
    const workspaceId = Number(resolvedParams.id);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const [workspace] = await sql`
      SELECT id, name, image_url FROM workspaces 
      WHERE id = ${workspaceId} AND owner_id = ${user.id}
    `;

    if (!workspace) {
      return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (err) {
    if ((err as Error).message === "Unauthenticated") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Error obteniendo workspace:", err);
    return NextResponse.json({ error: "Error obteniendo workspace" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { //Update
    try {
      const user = requireAuth(req);
      const resolvedParams = await params;
      const workspaceId = Number(resolvedParams.id);
      if (Number.isNaN(workspaceId)) {
        return NextResponse.json({ error: "ID inválido" }, { status: 400 });
      }
  
      const { name, image_url } = await req.json();
  
      const safeName = typeof name === "string" ? name : null;
      const safeImageUrl = typeof image_url === "string" ? image_url : null;
  
      const [workspace] = await sql`
        SELECT owner_id FROM workspaces WHERE id = ${workspaceId}
      `;
  
      if (!workspace || workspace.owner_id !== user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
  
      const updatedWorkspace = await sql`
        UPDATE workspaces
        SET
          name = COALESCE(${safeName}, name),
          image_url = COALESCE(${safeImageUrl}, image_url)
        WHERE id = ${workspaceId}
        RETURNING id, name, image_url, owner_id
      `;
  
      if (!updatedWorkspace || updatedWorkspace.length === 0) {
        return NextResponse.json({ error: "No se encontró el workspace para actualizar" }, { status: 404 });
      }
  
      return NextResponse.json(updatedWorkspace[0]);
    } catch (err) {
      console.error("Error actualizando workspace:", err instanceof Error ? err.message : err);
      if ((err as Error).message === "Unauthenticated") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      return NextResponse.json({ error: "Error actualizando workspace" }, { status: 500 });
    }
  }

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { //Delete
    try {
      const user = requireAuth(req);
      const resolvedParams = await params;
      const workspaceId = Number(resolvedParams.id);
      if (Number.isNaN(workspaceId)) {
        return NextResponse.json({ error: "ID inválido" }, { status: 400 });
      }
  
      // Verificar que el usuario es dueño del workspace
      const [workspace] = await sql`
        SELECT owner_id FROM workspaces WHERE id = ${workspaceId}
      `;
  
      if (!workspace || workspace.owner_id !== user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
  
      // Eliminar workspace (ON DELETE CASCADE eliminará boards, listas, cartas)
      await sql`
        DELETE FROM workspaces WHERE id = ${workspaceId}
      `;
  
      return NextResponse.json({ message: "Workspace eliminado" });
    } catch (err) {
      if ((err as Error).message === "Unauthenticated") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      console.error("Error eliminando workspace:", err);
      return NextResponse.json({ error: "Error eliminando workspace" }, { status: 500 });
    }
  }