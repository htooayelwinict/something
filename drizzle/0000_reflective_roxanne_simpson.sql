CREATE TABLE `birth_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`birth_date` text NOT NULL,
	`birth_time` text NOT NULL,
	`birth_city` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`timezone` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `birth_profiles_active_user_idx` ON `birth_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`locale` text DEFAULT 'my' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `readings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`birth_profile_id` text NOT NULL,
	`kind` text NOT NULL,
	`question` text,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`chart_snapshot` text NOT NULL,
	`calculation_version` text NOT NULL,
	`prompt_version` text NOT NULL,
	`response_text` text,
	`status` text NOT NULL,
	`error_code` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`birth_profile_id`) REFERENCES `birth_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `readings_user_created_idx` ON `readings` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `readings_owner_id_idx` ON `readings` (`user_id`,`id`);--> statement-breakpoint
CREATE TABLE `tarot_specialists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`initials` text NOT NULL,
	`specialty` text NOT NULL,
	`experience` text NOT NULL,
	`display_rate` text NOT NULL,
	`availability_label` text NOT NULL,
	`tags` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tarot_specialists_sort_idx` ON `tarot_specialists` (`sort_order`);
--> statement-breakpoint
INSERT OR IGNORE INTO `tarot_specialists` (`id`, `name`, `initials`, `specialty`, `experience`, `display_rate`, `availability_label`, `tags`, `sort_order`)
VALUES ('tsp_thiri', 'သီရိလမင်း', 'TL', 'Tarot & Relationship Guidance', 'အတွေ့အကြုံ ၆ နှစ်', '၁၅ မိနစ် · ၁၂,၀၀၀ ကျပ်', 'မကြာမီ ရနိုင်မည်', '["ချစ်ရေး","အလုပ်အကိုင်","စိတ်ခံစားမှု"]', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO `tarot_specialists` (`id`, `name`, `initials`, `specialty`, `experience`, `display_rate`, `availability_label`, `tags`, `sort_order`)
VALUES ('tsp_min_thu', 'မင်းသူရ', 'MT', 'Intuitive Tarot & Life Direction', 'အတွေ့အကြုံ ၉ နှစ်', '၁၅ မိနစ် · ၁၅,၀၀၀ ကျပ်', 'မကြာမီ ရနိုင်မည်', '["ဘဝလမ်းကြောင်း","စီးပွားရေး","ဆုံးဖြတ်ချက်"]', 2);
--> statement-breakpoint
PRAGMA optimize;
