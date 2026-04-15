import OpenAI from "openai";
import { toFile } from "openai/uploads";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface VideoContext {
  type: "transcript" | "audio-visual" | "metadata";
  transcript?: string;
  audioTranscript?: string;
  frames?: string[];
  videoTitle?: string;
}

// ─── Audio transcription via Whisper ───

export async function transcribeAudio(
  audioBuffer: Buffer,
  extension: string
): Promise<string | null> {
  try {
    const file = await toFile(audioBuffer, `audio.${extension}`);
    const result = await openai.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file,
    });
    return result.text && result.text.length > 10 ? result.text : null;
  } catch (e) {
    console.error("Whisper transcription failed:", e);
    return null;
  }
}

// ─── Build context prefix ───

function buildVideoPrefix(vc: VideoContext): string {
  const title = vc.videoTitle || "YouTube Video";

  if (vc.type === "transcript" && vc.transcript) {
    return (
      `[The user is discussing this YouTube video: "${title}"]\n\n` +
      `Here is the full transcript:\n\n${vc.transcript}\n\n` +
      `--- End of transcript ---\n\n`
    );
  }

  if (vc.type === "audio-visual") {
    let prefix =
      `[The user is discussing this YouTube video: "${title}"]\n\n`;

    if (vc.audioTranscript) {
      prefix +=
        `Audio transcription (from Whisper):\n\n${vc.audioTranscript}\n\n` +
        `--- End of audio transcription ---\n\n`;
    }

    if (vc.frames && vc.frames.length > 0) {
      prefix +=
        `I'm also sending ${vc.frames.length} frame(s) captured from the video for visual analysis.\n\n`;
    }

    return prefix;
  }

  if (vc.type === "metadata") {
    return (
      `[The user is discussing this YouTube video: "${title}"]\n` +
      `Note: No transcript or video data is available. You only know the title. ` +
      `Be honest about what you can and cannot determine from the title alone. ` +
      `Do NOT guess or hallucinate details about the video content.\n\n`
    );
  }

  return (
    `[The user is discussing this YouTube video: "${title}"]\n` +
    `Note: No transcript or video data is available for this message. ` +
    `You only know the title. Be honest about what you can and cannot determine.\n\n`
  );
}

// ─── Chat with context ───

export async function chatWithContext(
  messages: ChatMessage[],
  videoContext?: VideoContext,
  characterPersonality?: string
): Promise<string> {
  const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  const systemPrompt = characterPersonality
    ? `${characterPersonality}\n\n` +
      `IMPORTANT: You ARE this character. Stay in character at all times. ` +
      `Never say "I am an AI" or break the fourth wall. Respond as this character would. ` +
      `If asked about your age, background, or personal details, answer as the character, not as an AI.\n\n` +
      `You can also discuss YouTube videos when the user shares one. Use markdown for formatting when helpful.`
    : `You are a helpful, friendly AI assistant that can discuss YouTube videos. ` +
      `When a user shares a video, you analyze its content deeply. ` +
      `Be conversational, insightful, and engaging — like a knowledgeable friend. ` +
      `Use markdown for formatting when helpful. Keep responses concise but thorough.`;

  apiMessages.push({ role: "system", content: systemPrompt });

  for (const msg of messages) {
    if (msg.role === "system") continue;
    apiMessages.push({ role: msg.role, content: msg.content });
  }

  if (videoContext) {
    const lastIdx = apiMessages.length - 1;
    const lastMsg = apiMessages[lastIdx];

    if (lastMsg && lastMsg.role === "user") {
      const prefix = buildVideoPrefix(videoContext);
      const userText = prefix + (lastMsg.content as string);

      if (
        videoContext.type === "audio-visual" &&
        videoContext.frames &&
        videoContext.frames.length > 0
      ) {
        const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
          { type: "text", text: userText },
        ];

        for (const frame of videoContext.frames) {
          parts.push({
            type: "image_url",
            image_url: { url: frame, detail: "high" },
          });
        }

        apiMessages[lastIdx] = { role: "user", content: parts };
      } else {
        lastMsg.content = userText;
      }
    }
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    messages: apiMessages,
    max_completion_tokens: 4096,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
}
