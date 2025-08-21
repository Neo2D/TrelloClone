// /app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar token y obtener payload
    let payload;
    try {
      payload = requireAuth(req); // lanza si no autenticado
    } catch (e) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = Number(params.id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Sólo el mismo usuario puede eliminar su cuenta (si quieres admins, aquí agregar lógica)
    if (payload.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Borrado (si usaste ON DELETE CASCADE en las FK, todo se elimina relacionado)
    await sql`DELETE FROM users WHERE id = ${userId}`;

    // Responder y eliminar cookie
    const res = NextResponse.json({ message: "Cuenta eliminada" });
    res.cookies.set("token", "", { httpOnly: true, path: "/", maxAge: 0 });

    return res;
  } catch (err) {
    console.error("delete user error:", err);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
