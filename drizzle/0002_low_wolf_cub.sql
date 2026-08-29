CREATE TABLE `tarot_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`ip_hash` text,
	`specialist_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`contact_channel` text NOT NULL,
	`preferred_date` text NOT NULL,
	`preferred_time` text NOT NULL,
	`topic` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tarot_bookings_specialist_idx` ON `tarot_bookings` (`specialist_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `tarot_bookings_user_idx` ON `tarot_bookings` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `tarot_bookings_ip_idx` ON `tarot_bookings` (`ip_hash`,`created_at`);--> statement-breakpoint
ALTER TABLE `tarot_specialists` ADD `location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tarot_specialists` ADD `session_minutes` integer DEFAULT 30 NOT NULL;