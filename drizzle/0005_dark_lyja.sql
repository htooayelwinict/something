ALTER TABLE `tarot_bookings` ADD `staff_note` text;--> statement-breakpoint
ALTER TABLE `tarot_specialists` ADD `login_email` text;--> statement-breakpoint
ALTER TABLE `tarot_specialists` ADD `bio` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tarot_specialists` ADD `photo_url` text;--> statement-breakpoint
ALTER TABLE `tarot_specialists` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `tarot_specialists_login_email_idx` ON `tarot_specialists` (`login_email`);