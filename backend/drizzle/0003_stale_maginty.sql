PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`executed_at` text DEFAULT CURRENT_TIMESTAMP,
	`command` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`trigger_type` text NOT NULL,
	`timer_id` integer NOT NULL,
	FOREIGN KEY (`timer_id`) REFERENCES `timers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_logs`("id", "executed_at", "command", "status", "error_message", "trigger_type", "timer_id") SELECT "id", "executed_at", "command", "status", "error_message", "trigger_type", "timer_id" FROM `logs`;--> statement-breakpoint
DROP TABLE `logs`;--> statement-breakpoint
ALTER TABLE `__new_logs` RENAME TO `logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;