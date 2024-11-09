import { Hono } from "hono";
import type { FC } from 'hono/jsx'
import { serve as serveHono } from "@hono/node-server";
import { logger, env, agent } from ".";
import { db, savedPosts } from "./db";
import { eq } from "drizzle-orm";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

const Layout: FC = (props) => {
  return (
    <html>
      <head>
        <script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <main class="flex flex-col gap-6 items-center">
          <div class="flex justify-center flex-col mt-4">{props.children}</div>
        </main>
      </body>
    </html>
  )
}

const Bookmark: FC<{ post: PostView }> = ({ post }) => {
  const [, , , rkey] = post.uri.substring(5).split("/");
  post.record

  return (
    <blockquote class="bluesky-embed" data-bluesky-uri={post.uri} data-bluesky-cid={post.cid}>
      <p lang="en">{post.record.text}</p>
      &mdash; {post.author.displayName || "@" + post.author.handle} (<a href={`https://bsky.app/profile/${post.author.did}`}>@{post.author.handle}</a>)
      <a href={`https://bsky.app/profile/${post.author.did}/post/${rkey}`}>{formatDate(post.record.createdAt)}</a>
    </blockquote>
  )
}

const BookmarksPage: FC<{ posts: PostView[], username: string }> = (props: {
  posts: PostView[],
  username: string
}) => {
  return (
    <Layout>
      <h1 class="text-2xl font-medium">@{props.username}'s bookmarks</h1>
      <ul>
        {props.posts.map((post) => {
          return <Bookmark post={post} key={post.cid} />
        })}
      </ul>
    </Layout>
  )
}

const app = new Hono();
app.get("/", (c) => c.text("Hono!"));
app.get("/view/:handle", async (c) => {
  const { data } = await agent.getProfile({ actor: c.req.param("handle") })
  const { did } = data
  const bookmarks = await db.select().from(savedPosts).where(eq(savedPosts.savedByDid, did))
  const uris = bookmarks.map((b) => b.uri)
  const posts = await fetchAllPosts(uris)
  return c.render(<BookmarksPage posts={posts} username={c.req.param("handle")} />)
});

serveHono(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    logger.info(`Listening on http://localhost:${info.port}`);
  }
);

const chunkArray = (array: any[], chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};
const fetchAllPosts = async (uris: string[]) => {
  let allPosts: PostView[] = [];
  const chunkedUris = chunkArray(uris, 25);
  for (const chunk of chunkedUris) {
    const response = await agent.getPosts({ uris: chunk });
    allPosts = allPosts.concat(response.data.posts);
  }
  return allPosts;
};
const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};