CREATE TABLE `logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`executed_at` text DEFAULT CURRENT_TIMESTAMP,
	`device_name` text NOT NULL,
	`command` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`trigger_type` text NOT NULL,
	`timer_id` integer,
	FOREIGN KEY (`timer_id`) REFERENCES `timers`(`id`) ON UPDATE no action ON DELETE no action
);
