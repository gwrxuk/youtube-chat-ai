import { NextRequest, NextResponse } from "next/server";
import {
  extractVideoId,
  getVideoInfo,
  getTranscript,
  getVideoFrames,
  downloadAudioBuffer,
} from "@/lib/youtube";
import { transcribeAudio } from "@/lib/openai";

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

    // 1) Try text transcript first (cheapest, fastest)
    const transcript = await getTranscript(videoId);

    if (transcript && transcript.length > 50) {
      return NextResponse.json({
        ...info,
        contextType: "transcript" as const,
        transcript,
      });
    }

    // 2) No transcript — extract frames + transcribe audio
    const [frames, audioData] = await Promise.all([
      getVideoFrames(videoId),
      downloadAudioBuffer(videoId),
    ]);

    let audioTranscript: string | null = null;
    if (audioData) {
      audioTranscript = await transcribeAudio(
        audioData.buffer,
        audioData.extension
      );
    }

    if (audioTranscript || frames.length > 0) {
      return NextResponse.json({
        ...info,
        contextType: "audio-visual" as const,
        audioTranscript: audioTranscript || undefined,
        frames: frames.length > 0 ? frames : undefined,
      });
    }

    // 3) Nothing worked — metadata only
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
