import { NextRequest, NextResponse } from "next/server";
import {
  extractVideoId,
  getVideoInfo,
  getTranscript,
  downloadVideoToBuffer,
} from "@/lib/youtube";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const info = await getVideoInfo(videoId);

    const transcript = await getTranscript(videoId);

    if (transcript && transcript.length > 50) {
      return NextResponse.json({
        ...info,
        contextType: "transcript" as const,
        transcript,
      });
    }

    // No transcript — download video to memory for vision API
    const videoBuffer = await downloadVideoToBuffer(videoId);
    if (videoBuffer) {
      const videoBase64 = videoBuffer.toString("base64");
      return NextResponse.json({
        ...info,
        contextType: "video" as const,
        videoBase64,
      });
    }

    return NextResponse.json({
      ...info,
      contextType: "none" as const,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to process video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
