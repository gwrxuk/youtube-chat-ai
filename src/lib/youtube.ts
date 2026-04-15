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

const MAX_VIDEO_BYTES = 18 * 1024 * 1024;

export async function downloadVideoToBuffer(
  videoId: string
): Promise<Buffer | null> {
  try {
    // Dynamic import so build doesn't evaluate the module at compile time
    const ytdl = (await import("@distube/ytdl-core")).default;

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    const format =
      ytdl.chooseFormat(info.formats, {
        quality: "lowest",
        filter: "videoandaudio",
      }) ||
      ytdl.chooseFormat(info.formats, {
        quality: "lowest",
        filter: "video",
      });

    if (!format) return null;

    const stream = ytdl.downloadFromInfo(info, { format });
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (const chunk of stream) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_VIDEO_BYTES) {
        stream.destroy();
        break;
      }
      chunks.push(buf);
    }

    return chunks.length > 0 ? Buffer.concat(chunks) : null;
  } catch (e) {
    console.error("Video download failed:", e);
    return null;
  }
}
