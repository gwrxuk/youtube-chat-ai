import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  videoContext?: {
    type: "transcript" | "video";
    transcript?: string;
    videoBase64?: string;
    videoTitle?: string;
  };
}

export async function chatWithContext(
  messages: ChatMessage[],
  videoContext?: {
    type: "transcript" | "video";
    transcript?: string;
    videoBase64?: string;
    videoTitle?: string;
  },
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

    if (msg.role === "user" && msg.videoContext) {
      const vc = msg.videoContext;

      if (vc.type === "transcript" && vc.transcript) {
        apiMessages.push({
          role: "user",
          content:
            `[Video: "${vc.videoTitle || "YouTube Video"}"]\n\n` +
            `Here is the transcript of the video:\n\n${vc.transcript}\n\n` +
            `${msg.content}`,
        });
      } else if (vc.type === "video" && vc.videoBase64) {
        apiMessages.push({
          role: "user",
          content: [
            {
              type: "text",
              text:
                `[Video: "${vc.videoTitle || "YouTube Video"}"]\n\n` +
                `This video has no subtitles. I'm sending the video directly. ` +
                `Please watch and analyze it.\n\n${msg.content}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:video/mp4;base64,${vc.videoBase64}`,
                detail: "auto",
              },
            },
          ],
        });
      } else {
        apiMessages.push({ role: "user", content: msg.content });
      }
    } else {
      apiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  if (videoContext) {
    const lastMsg = apiMessages[apiMessages.length - 1];
    if (lastMsg && lastMsg.role === "user" && typeof lastMsg.content === "string") {
      if (videoContext.type === "transcript" && videoContext.transcript) {
        lastMsg.content =
          `[Video: "${videoContext.videoTitle || "YouTube Video"}"]\n\n` +
          `Transcript:\n${videoContext.transcript}\n\n` +
          lastMsg.content;
      } else if (videoContext.type === "video" && videoContext.videoBase64) {
        apiMessages[apiMessages.length - 1] = {
          role: "user",
          content: [
            {
              type: "text",
              text:
                `[Video: "${videoContext.videoTitle || "YouTube Video"}"]\n\n` +
                `This video has no subtitles. Analyze the video content.\n\n` +
                (lastMsg.content as string),
            },
            {
              type: "image_url",
              image_url: {
                url: `data:video/mp4;base64,${videoContext.videoBase64}`,
                detail: "auto",
              },
            },
          ],
        };
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
