import { NextRequest, NextResponse } from "next/server";
import {
  getCharacters,
  upsertCharacter,
  deleteCharacter,
  DbCharacter,
} from "@/lib/db";

export async function GET() {
  try {
    const chars = await getCharacters();
    return NextResponse.json(chars);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load characters";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DbCharacter;
    await upsertCharacter({
      ...body,
      is_default: false,
      created_at: body.created_at || Date.now(),
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save character";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await deleteCharacter(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete character";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
