ALTER TABLE `saved_posts` ADD `postAuthorDid` text NOT NULL;--> statement-breakpoint
ALTER TABLE `saved_posts` ADD `savedByDid` text NOT NULL;--> statement-breakpoint
ALTER TABLE `saved_posts` DROP COLUMN `did`;