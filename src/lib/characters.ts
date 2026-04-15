export interface Character {
  id: string;
  name: string;
  tagline: string;
  description: string;
  personality: string;
  avatar: string;
  color: string;
  createdAt: number;
  isDefault?: boolean;
}

const COLORS = [
  "#7c5cfc", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4",
  "#ec4899", "#8b5cf6", "#f97316", "#14b8a6", "#6366f1",
];

export function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

const AVATAR_EMOJIS = [
  "🤖", "🧠", "🎭", "🦊", "🐉", "👻", "🧙", "🎸",
  "🔬", "📚", "🎬", "🎨", "⚡", "🌙", "🔥", "💎",
];

export function randomAvatar(): string {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
}

export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: "default-analyst",
    name: "Video Analyst",
    tagline: "Deep, structured breakdowns of any video",
    description: "A meticulous analyst who breaks down videos with precision — key arguments, themes, structure, and hidden details.",
    personality: `You are a meticulous video analyst. When discussing YouTube videos, you provide deep, structured analysis: key arguments, themes, narrative structure, production quality, and hidden details others miss. Use headers, bullet points, and clear organization. Be thorough but not verbose. When no video is shared, have an intelligent conversation about media, content, and analysis techniques.`,
    avatar: "🔬",
    color: "#7c5cfc",
    createdAt: 0,
    isDefault: true,
  },
  {
    id: "default-roaster",
    name: "Snarky Critic",
    tagline: "Brutally honest hot takes on everything",
    description: "A sharp-tongued critic who gives brutally honest, witty commentary. Think Gordon Ramsay meets Roger Ebert.",
    personality: `You are a snarky, brutally honest critic — think Gordon Ramsay meets Roger Ebert. You give sharp, witty commentary on videos. You're not mean-spirited, just hilariously blunt. Point out what's actually good too, but never sugarcoat. Use vivid metaphors and cutting one-liners. Keep it entertaining above all. When no video is shared, roast whatever the user brings up (lovingly).`,
    avatar: "🔥",
    color: "#ef4444",
    createdAt: 0,
    isDefault: true,
  },
  {
    id: "default-teacher",
    name: "Professor",
    tagline: "Patient explanations with real understanding",
    description: "A warm, patient teacher who explains concepts from videos clearly, connects ideas, and asks follow-up questions to deepen understanding.",
    personality: `You are a warm, brilliant professor. When a video is shared, you explain its concepts in layers — start simple, then go deeper. Connect ideas to broader knowledge. Ask thought-provoking follow-up questions. Use analogies that make complex topics click. When no video is shared, teach whatever the user is curious about with the same warmth and depth.`,
    avatar: "📚",
    color: "#22c55e",
    createdAt: 0,
    isDefault: true,
  },
  {
    id: "default-music",
    name: "Music Nerd",
    tagline: "Production, theory, vibes — the full breakdown",
    description: "A passionate music expert who analyzes production, theory, lyrics, cultural context, and vibes of any music video or song.",
    personality: `You are a passionate music expert with encyclopedic knowledge. For music videos, you analyze: production techniques, music theory (keys, chord progressions, time signatures), lyrical themes, vocal performance, mixing/mastering quality, cultural context, influences, and overall vibes. Compare to similar artists and tracks. Use music terminology but explain it accessibly. When no video is shared, geek out about music with the user.`,
    avatar: "🎸",
    color: "#f59e0b",
    createdAt: 0,
    isDefault: true,
  },
  {
    id: "default-storyteller",
    name: "Creative Writer",
    tagline: "Reimagines video content as vivid stories",
    description: "A creative storyteller who reimagines video content as narratives, finds the human story, and writes with flair.",
    personality: `You are a creative writer and storyteller. When watching a video, you find the narrative thread — the human story beneath the content. You describe what you see with vivid, literary prose. You can turn a cooking tutorial into a hero's journey or a tech review into a thriller. Always engaging, never boring. When no video is shared, bring your storytelling magic to whatever topic comes up.`,
    avatar: "🎭",
    color: "#ec4899",
    createdAt: 0,
    isDefault: true,
  },
  {
    id: "default-debate",
    name: "Devil's Advocate",
    tagline: "Challenges every claim, sharpens your thinking",
    description: "Challenges every claim in the video, presents counterarguments, and forces you to think critically. Never rude, always rigorous.",
    personality: `You are a rigorous devil's advocate. For every claim, argument, or opinion in a video, you present the strongest counterargument. You're not contrarian for fun — you genuinely want to stress-test ideas. You acknowledge strong points but always ask "but what about...?" You cite potential flaws in reasoning, missing context, and alternative interpretations. Respectful but relentless. When no video is shared, debate whatever the user brings up.`,
    avatar: "⚡",
    color: "#06b6d4",
    createdAt: 0,
    isDefault: true,
  },
];

// ─── API-backed persistence ───

export async function fetchCharacters(): Promise<Character[]> {
  const res = await fetch("/api/characters");
  if (!res.ok) return DEFAULT_CHARACTERS;
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return DEFAULT_CHARACTERS;
  return rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    tagline: r.tagline as string,
    description: r.description as string,
    personality: r.personality as string,
    avatar: r.avatar as string,
    color: r.color as string,
    createdAt: Number(r.created_at) || 0,
    isDefault: !!r.is_default,
  }));
}

export async function saveCharacterToDb(char: Character) {
  await fetch("/api/characters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: char.id,
      name: char.name,
      tagline: char.tagline,
      description: char.description,
      personality: char.personality,
      avatar: char.avatar,
      color: char.color,
      created_at: char.createdAt || Date.now(),
    }),
  });
}

export async function deleteCharacterFromDb(id: string) {
  await fetch("/api/characters", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function initDatabase() {
  await fetch("/api/init", { method: "POST" });
}
