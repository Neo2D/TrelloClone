// app/api/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth"; // el helper que definimos antes para verificar token

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const { name, image_url } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const [workspace] = await sql`
      INSERT INTO workspaces (name, image_url, owner_id)
      VALUES (${name}, ${image_url ?? null}, ${user.id})
      RETURNING id, name, image_url, owner_id
    `;

    return NextResponse.json(workspace, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthenticated") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Error creando workspace:", err);
    return NextResponse.json({ error: "Error creando workspace" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const workspaces = await sql`
      SELECT id, name, image_url, owner_id
      FROM workspaces
      WHERE owner_id = ${user.id}
      ORDER BY id DESC
    `;

    return NextResponse.json(workspaces);
  } catch (err) {
    if ((err as Error).message === "Unauthenticated") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Error listando workspaces:", err);
    return NextResponse.json({ error: "Error listando workspaces" }, { status: 500 });
  }
}
