ALTER TABLE `logs` ADD `device_id` text;--> statement-breakpoint
UPDATE `logs` SET `device_id` = (SELECT `device_id` FROM `timers` WHERE `timers`.`id` = `logs`.`timer_id`);--> statement-breakpoint
ALTER TABLE `timers` ADD `device_ids` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
UPDATE `timers` SET `device_ids` = json_array(`device_id`);--> statement-breakpoint
ALTER TABLE `timers` DROP COLUMN `device_id`;
