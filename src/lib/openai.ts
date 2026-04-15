import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface VideoContext {
  type: "transcript" | "video" | "metadata";
  transcript?: string;
  videoBase64?: string;
  videoTitle?: string;
}

function buildVideoPrefix(vc: VideoContext): string {
  const title = vc.videoTitle || "YouTube Video";

  if (vc.type === "transcript" && vc.transcript) {
    return (
      `[The user is discussing this YouTube video: "${title}"]\n\n` +
      `Here is the full transcript:\n\n${vc.transcript}\n\n` +
      `--- End of transcript ---\n\n`
    );
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

export async function chatWithContext(
  messages: ChatMessage[],
  videoContext?: VideoContext,
  characterPersonality?: string
): Promise<string> {
  const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  const systemPrompt = characterPersonality
    ? `${characterPersonality}\n\nYou can also discuss YouTube videos when the user shares one. Use markdown for formatting when helpful.`
    : `You are a helpful, friendly AI assistant that can discuss YouTube videos. ` +
      `When a user shares a video, you analyze its content deeply. ` +
      `Be conversational, insightful, and engaging — like a knowledgeable friend. ` +
      `Use markdown for formatting when helpful. Keep responses concise but thorough.`;

  apiMessages.push({ role: "system", content: systemPrompt });

  for (const msg of messages) {
    if (msg.role === "system") continue;
    apiMessages.push({ role: msg.role, content: msg.content });
  }

  // Attach video context to the last user message
  if (videoContext) {
    const lastIdx = apiMessages.length - 1;
    const lastMsg = apiMessages[lastIdx];

    if (lastMsg && lastMsg.role === "user") {
      if (videoContext.type === "video" && videoContext.videoBase64) {
        const textContent =
          buildVideoPrefix(videoContext) +
          `The video has no subtitles. I'm sending the video directly for you to analyze.\n\n` +
          (lastMsg.content as string);

        apiMessages[lastIdx] = {
          role: "user",
          content: [
            { type: "text", text: textContent },
            {
              type: "image_url",
              image_url: {
                url: `data:video/mp4;base64,${videoContext.videoBase64}`,
                detail: "auto",
              },
            },
          ],
        };
      } else {
        // Transcript or metadata — prepend context to the text
        const prefix = buildVideoPrefix(videoContext);
        lastMsg.content = prefix + (lastMsg.content as string);
      }
    }
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: apiMessages,
    max_tokens: 4096,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
}
