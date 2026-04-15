import { NextResponse } from "next/server";
import { initDb, upsertCharacter, getCharacters } from "@/lib/db";
import { DEFAULT_CHARACTERS } from "@/lib/characters";

export async function POST() {
  try {
    await initDb();

    const existing = await getCharacters();
    const existingIds = new Set(existing.map((c) => c.id));

    for (const char of DEFAULT_CHARACTERS) {
      if (!existingIds.has(char.id)) {
        await upsertCharacter({
          id: char.id,
          name: char.name,
          tagline: char.tagline,
          description: char.description,
          personality: char.personality,
          avatar: char.avatar,
          color: char.color,
          is_default: true,
          created_at: char.createdAt || Date.now(),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Init failed";
    console.error("DB init error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
