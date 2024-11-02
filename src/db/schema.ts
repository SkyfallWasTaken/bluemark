import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const savedPosts = sqliteTable("saved_posts", {
  cid: text().notNull(),
  uri: text().notNull(),
  savedByDid: text().notNull(),
});

export const SavedPost = savedPosts.$inferSelect;
