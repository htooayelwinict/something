CREATE TABLE `period_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`period_key` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`evidence` text NOT NULL,
	`calculation_version` text NOT NULL,
	`ruleset_version` text NOT NULL,
	`prompt_version` text NOT NULL,
	`response_text` text,
	`interpretation_mode` text DEFAULT 'deterministic' NOT NULL,
	`status` text NOT NULL,
	`error_code` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `period_readings_key_idx` ON `period_readings` (`user_id`,`kind`,`period_key`,`prompt_version`);--> statement-breakpoint
CREATE INDEX `period_readings_user_idx` ON `period_readings` (`user_id`,`created_at`);