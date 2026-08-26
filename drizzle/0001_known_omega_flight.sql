ALTER TABLE `readings` ADD `interpretation_mode` text DEFAULT 'deterministic' NOT NULL;--> statement-breakpoint
ALTER TABLE `readings` ADD `feedback` text;