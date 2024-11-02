import { drizzle } from "drizzle-orm/libsql";
import { savedPosts, SavedPost } from "./schema";

const db = drizzle({ connection: process.env.DATABASE_URL! });

export { db, savedPosts, SavedPost };
