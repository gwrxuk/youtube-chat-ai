import { NextRequest, NextResponse } from "next/server";
import {
  getConversations,
  getConversation,
  upsertConversation,
  deleteConversation,
  getMessages,
  insertMessage,
  DbConversation,
  DbMessage,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const characterId = req.nextUrl.searchParams.get("characterId");
    const conversationId = req.nextUrl.searchParams.get("id");

    if (conversationId) {
      const conv = await getConversation(conversationId);
      if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const messages = await getMessages(conversationId);
      return NextResponse.json({ ...conv, messages });
    }

    if (characterId) {
      const convs = await getConversations(characterId);
      return NextResponse.json(convs);
    }

    return NextResponse.json({ error: "characterId or id required" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load conversations";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversation, message } = body as {
      conversation?: DbConversation;
      message?: DbMessage;
    };

    if (conversation) {
      await upsertConversation(conversation);
    }

    if (message) {
      await insertMessage(message);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await deleteConversation(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
