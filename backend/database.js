import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function openDatabase(filename) {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password TEXT NOT NULL, name TEXT NOT NULL, bio TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );`);
  db.exec(`CREATE TABLE IF NOT EXISTS friend_requests (
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (sender_id, receiver_id), CHECK(sender_id != receiver_id)
    );
    CREATE TABLE IF NOT EXISTS friendships (
      user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      PRIMARY KEY(user_a,user_b), CHECK(user_a < user_b)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS messages_chat ON messages(sender_id,receiver_id,created_at);
    CREATE INDEX IF NOT EXISTS messages_inbox ON messages(receiver_id,created_at);`);
  db.exec(`CREATE TABLE IF NOT EXISTS blocks (
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY(owner_id, blocked_id), CHECK(owner_id != blocked_id)
  );`);
  db.exec(`CREATE TABLE IF NOT EXISTS communities (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_id TEXT NOT NULL REFERENCES users(id), invite_code TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS community_members (
    community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('owner','admin','member')) DEFAULT 'member',
    joined_at INTEGER NOT NULL, PRIMARY KEY(community_id,user_id)
  );
  CREATE TABLE IF NOT EXISTS community_channels (
    id TEXT PRIMARY KEY, community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    name TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('text','voice')) DEFAULT 'text',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS channel_messages (
    id TEXT PRIMARY KEY, channel_id TEXT NOT NULL REFERENCES community_channels(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id), content TEXT NOT NULL, created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS channel_messages_idx ON channel_messages(channel_id,created_at);
  CREATE INDEX IF NOT EXISTS member_user_idx ON community_members(user_id);
  `);
  if (!db.prepare('PRAGMA table_info(users)').all().some(column => column.name === 'banner')) {
    db.exec("ALTER TABLE users ADD COLUMN banner TEXT NOT NULL DEFAULT ''");
  }
  db.exec(`CREATE TABLE IF NOT EXISTS community_categories (
    id TEXT PRIMARY KEY, community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    name TEXT NOT NULL, created_at INTEGER NOT NULL
  );`);
  if(!db.prepare('PRAGMA table_info(community_channels)').all().some(column=>column.name==='category_id')){
    db.exec('ALTER TABLE community_channels ADD COLUMN category_id TEXT');
  }
  db.exec(`CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, type TEXT NOT NULL, purpose TEXT NOT NULL, data BLOB NOT NULL, created_at INTEGER NOT NULL
  ); CREATE INDEX IF NOT EXISTS media_owner ON media(owner_id);`);
  for(const table of ['messages','channel_messages'])if(!db.prepare('PRAGMA table_info('+table+')').all().some(c=>c.name==='attachments'))db.exec("ALTER TABLE "+table+" ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'");
  if(!db.prepare('PRAGMA table_info(communities)').all().some(c=>c.name==='icon'))db.exec("ALTER TABLE communities ADD COLUMN icon TEXT NOT NULL DEFAULT ''");
  return db;
}
