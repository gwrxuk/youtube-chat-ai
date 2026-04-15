import { neon } from "@neondatabase/serverless";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

// ─── Schema initialization ───

export async function initDb() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      personality TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT '🤖',
      color TEXT NOT NULL DEFAULT '#7c5cfc',
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'New Chat',
      last_message TEXT NOT NULL DEFAULT '',
      video_json TEXT,
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
      updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_conversations_character
    ON conversations(character_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id, created_at)
  `;
}

// ─── Characters ───

export interface DbCharacter {
  id: string;
  name: string;
  tagline: string;
  description: string;
  personality: string;
  avatar: string;
  color: string;
  is_default: boolean;
  created_at: number;
}

export async function getCharacters(): Promise<DbCharacter[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM characters ORDER BY is_default DESC, created_at ASC`;
  return rows as DbCharacter[];
}

export async function getCharacter(id: string): Promise<DbCharacter | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM characters WHERE id = ${id}`;
  return (rows[0] as DbCharacter) || null;
}

export async function upsertCharacter(char: DbCharacter) {
  const sql = getDb();
  await sql`
    INSERT INTO characters (id, name, tagline, description, personality, avatar, color, is_default, created_at)
    VALUES (${char.id}, ${char.name}, ${char.tagline}, ${char.description}, ${char.personality}, ${char.avatar}, ${char.color}, ${char.is_default}, ${char.created_at})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      tagline = EXCLUDED.tagline,
      description = EXCLUDED.description,
      personality = EXCLUDED.personality,
      avatar = EXCLUDED.avatar,
      color = EXCLUDED.color
  `;
}

export async function deleteCharacter(id: string) {
  const sql = getDb();
  await sql`DELETE FROM characters WHERE id = ${id} AND is_default = false`;
}

// ─── Conversations ───

export interface DbConversation {
  id: string;
  character_id: string;
  title: string;
  last_message: string;
  video_json: string | null;
  created_at: number;
  updated_at: number;
}

export async function getConversations(characterId: string): Promise<DbConversation[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM conversations
    WHERE character_id = ${characterId}
    ORDER BY updated_at DESC
  `;
  return rows as DbConversation[];
}

export async function getConversation(id: string): Promise<DbConversation | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM conversations WHERE id = ${id}`;
  return (rows[0] as DbConversation) || null;
}

export async function upsertConversation(conv: DbConversation) {
  const sql = getDb();
  await sql`
    INSERT INTO conversations (id, character_id, title, last_message, video_json, created_at, updated_at)
    VALUES (${conv.id}, ${conv.character_id}, ${conv.title}, ${conv.last_message}, ${conv.video_json}, ${conv.created_at}, ${conv.updated_at})
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      last_message = EXCLUDED.last_message,
      video_json = EXCLUDED.video_json,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function deleteConversation(id: string) {
  const sql = getDb();
  await sql`DELETE FROM conversations WHERE id = ${id}`;
}

// ─── Messages ───

export interface DbMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: number;
}

export async function getMessages(conversationId: string): Promise<DbMessage[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;
  return rows as DbMessage[];
}

export async function insertMessage(msg: DbMessage) {
  const sql = getDb();
  await sql`
    INSERT INTO messages (id, conversation_id, role, content, created_at)
    VALUES (${msg.id}, ${msg.conversation_id}, ${msg.role}, ${msg.content}, ${msg.created_at})
  `;
}
