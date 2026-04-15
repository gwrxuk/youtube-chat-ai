import { NextRequest, NextResponse } from "next/server";
import { chatWithContext, ChatMessage } from "@/lib/openai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, videoContext, characterPersonality } = body as {
      messages: ChatMessage[];
      videoContext?: {
        type: "transcript" | "video";
        transcript?: string;
        videoBase64?: string;
        videoTitle?: string;
      };
      characterPersonality?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const reply = await chatWithContext(messages, videoContext, characterPersonality);

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error("Chat error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to get AI response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
