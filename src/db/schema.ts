import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const savedPosts = sqliteTable("saved_posts", {
  url: text().notNull(),
  did: text().notNull(),
});

export const SavedPost = savedPosts.$inferSelect;
