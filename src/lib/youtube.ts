import { YoutubeTranscript } from "youtube-transcript";

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pat of patterns) {
    const m = url.match(pat);
    if (m) return m[1];
  }
  return null;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!res.ok) throw new Error("oEmbed failed");
    const data = await res.json();

    return {
      id: videoId,
      title: data.title || "YouTube Video",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: "",
    };
  } catch {
    return {
      id: videoId,
      title: "YouTube Video",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: "",
    };
  }
}

export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (!items || items.length === 0) return null;

    const text = items.map((i) => i.text).join(" ");
    return text.length > 30 ? text : null;
  } catch {
    return null;
  }
}

/**
 * Grab YouTube's auto-generated thumbnails at different timestamps
 * as base64 data URIs. These are available for every video without
 * needing ffmpeg.
 *
 * - /0.jpg = custom thumbnail (or default)
 * - /1.jpg, /2.jpg, /3.jpg = auto-generated at ~25%, 50%, 75%
 */
export async function getVideoFrames(videoId: string): Promise<string[]> {
  const urls = [
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/1.jpg`,
    `https://img.youtube.com/vi/${videoId}/2.jpg`,
    `https://img.youtube.com/vi/${videoId}/3.jpg`,
  ];

  const frames: string[] = [];
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) frames.push(r.value);
  }
  return frames;
}

const MAX_AUDIO_BYTES = 24 * 1024 * 1024; // Whisper limit is 25MB

export interface AudioData {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

export async function downloadAudioBuffer(
  videoId: string
): Promise<AudioData | null> {
  try {
    const ytdl = (await import("@distube/ytdl-core")).default;

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    const format = ytdl.chooseFormat(info.formats, {
      quality: "lowestaudio",
      filter: "audioonly",
    });

    if (!format) return null;

    const mime = format.mimeType?.split(";")[0] || "audio/mp4";
    const ext = mime.includes("webm") ? "webm" : "m4a";

    const stream = ytdl.downloadFromInfo(info, { format });
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (const chunk of stream) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_AUDIO_BYTES) {
        stream.destroy();
        break;
      }
      chunks.push(buf);
    }

    return chunks.length > 0
      ? { buffer: Buffer.concat(chunks), mimeType: mime, extension: ext }
      : null;
  } catch (e) {
    console.error("Audio download failed:", e);
    return null;
  }
}
