import "dotenv/config";
import { AtpAgent } from "@atproto/api";
import { z } from "zod";
import winston from "winston";
import { consoleFormat } from "winston-console-format";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.padLevels(),
        consoleFormat({
          showMeta: true,
          metaStrip: ["timestamp", "service"],
        })
      ),
    })
  );
}

const Env = z.object({
  ATPROTO_SERVICE: z.string().url(),
  ATPROTO_IDENTIFIER: z.string(),
  ATPROTO_PASSWORD: z.string(),
});
const env = Env.parse(process.env);

const agent = new AtpAgent({
  service: env.ATPROTO_SERVICE,
});
await agent.login({
  identifier: env.ATPROTO_IDENTIFIER,
  password: env.ATPROTO_PASSWORD,
});
logger.info(`Logged in as ${env.ATPROTO_IDENTIFIER}`);

setInterval(async () => {
  let notifs;

  while (!notifs || notifs.data.cursor) {
    notifs = await agent.app.bsky.notification.listNotifications({
      limit: 100,
      cursor: notifs?.data.cursor,
    });
    for (const notif of notifs.data.notifications
      .filter((notif) => notif.reason === "mention")
      .filter((notif) => !notif.isRead)) {
      logger.debug(
        `Mentioned by ${notif.author.displayName || notif.author.handle}`
      );

      const [repo, , rkey] = notif.uri.substring(5).split("/");
      const post = await agent.getPost({
        cid: notif.cid,
        repo,
        rkey,
      });
      const reply = post.value.reply;
      const postUri = reply ? reply.parent.uri : post.uri;
      const time = new Date().toISOString();
      logger.info(`postUri: ${postUri}`);

      await agent.app.bsky.notification.updateSeen({
        seenAt: time,
      });

      await agent.post({
        text: `👋 Hey @${notif.author.handle}, just saved that for you!`,
        reply: {
          root: {
            uri: reply?.root.uri || post.uri,
            cid: reply?.root.cid || post.cid,
          },
          parent: {
            uri: post.uri,
            cid: post.cid,
          },
        },
        createdAt: time,
      });
    }
  }
}, 5_000);
