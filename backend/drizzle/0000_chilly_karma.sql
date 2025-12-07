CREATE TABLE `timers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text DEFAULT 'My Timer' NOT NULL,
	`time` text NOT NULL,
	`weekdays` text NOT NULL,
	`device_id` text NOT NULL,
	`temperature` integer DEFAULT 24,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
