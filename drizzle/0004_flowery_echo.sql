ALTER TABLE `profiles` ADD `auth_provider` text DEFAULT 'chatgpt' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `auth_subject` text;--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_auth_idx` ON `profiles` (`auth_provider`,`auth_subject`);--> statement-breakpoint
CREATE INDEX `profiles_email_idx` ON `profiles` (`email`);--> statement-breakpoint
UPDATE `profiles` SET `auth_subject` = `id` WHERE `auth_subject` IS NULL;
