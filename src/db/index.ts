import { drizzle } from "drizzle-orm/libsql";
import { savedPosts, SavedPost } from "./schema";
import { env } from "..";

const db = drizzle({ connection: env.DATABASE_URL });

export { db, savedPosts, SavedPost };
