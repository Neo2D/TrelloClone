import { NextResponse, NextRequest } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// PATCH actualizar una lista por id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(req);
    const resolvedParams = await params;
    const listId = Number(resolvedParams.id);
    if (Number.isNaN(listId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { title, position, board_id } = await req.json();
    
    console.log('Updating list:', listId, 'with data:', { title, position, board_id });

    // Verify user has access to this list through the board
    const [listCheck] = await sql`
      SELECT lists.id, boards.workspace_id, workspaces.owner_id
      FROM lists
      JOIN boards ON lists.board_id = boards.id
      JOIN workspaces ON boards.workspace_id = workspaces.id
      WHERE lists.id = ${listId}
    `;

    if (!listCheck) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (listCheck.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = $' + (values.length + 2)); // +2 because listId is $1
      values.push(title);
    }
    if (position !== undefined) {
      updates.push('position = $' + (values.length + 2));
      values.push(position);
    }
    if (board_id !== undefined) {
      updates.push('board_id = $' + (values.length + 2));
      values.push(board_id);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const query = `
      UPDATE lists
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, title, position, board_id
    `;

    const [updatedList] = await sql.unsafe(query, [listId, ...values]);

    if (!updatedList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("Error updating list:", error);
    return NextResponse.json({ error: "Error updating list" }, { status: 500 });
  }
}

// DELETE eliminar una lista por id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(req);
    const resolvedParams = await params;
    const listId = Number(resolvedParams.id);
    if (Number.isNaN(listId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verify user has access to this list through the board
    const [listCheck] = await sql`
      SELECT lists.id, boards.workspace_id, workspaces.owner_id
      FROM lists
      JOIN boards ON lists.board_id = boards.id
      JOIN workspaces ON boards.workspace_id = workspaces.id
      WHERE lists.id = ${listId}
    `;

    if (!listCheck) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (listCheck.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [deletedList] = await sql`
      DELETE FROM lists
      WHERE id = ${listId}
      RETURNING id, title, position, board_id
    `;

    if (!deletedList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "List deleted successfully" });
  } catch (error) {
    console.error("Error deleting list:", error);
    return NextResponse.json({ error: "Error deleting list" }, { status: 500 });
  }
}