CREATE TABLE `account` (
	`id` varchar(191) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(255) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` datetime,
	`refresh_token_expires_at` datetime,
	`scope` text,
	`password` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_provider_account_idx` UNIQUE(`provider_id`,`account_id`)
);
--> statement-breakpoint
CREATE TABLE `children` (
	`id` varchar(191) NOT NULL,
	`family_id` varchar(191) NOT NULL,
	`nickname` varchar(40) NOT NULL,
	`birth_date` varchar(10) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `children_id` PRIMARY KEY(`id`),
	CONSTRAINT `children_family_idx` UNIQUE(`family_id`)
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` varchar(191) NOT NULL,
	`family_id` varchar(191) NOT NULL,
	`child_id` varchar(191) NOT NULL,
	`author_id` varchar(191) NOT NULL,
	`type` varchar(24) NOT NULL DEFAULT 'story',
	`title` varchar(80) NOT NULL DEFAULT '',
	`body` text NOT NULL,
	`happened_at` varchar(10) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `families` (
	`id` varchar(191) NOT NULL,
	`name` varchar(160) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `families_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_members` (
	`id` varchar(191) NOT NULL,
	`family_id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`display_name` varchar(120) NOT NULL,
	`role` varchar(24) NOT NULL DEFAULT 'member',
	`invite_status` varchar(24) NOT NULL DEFAULT 'accepted',
	`created_at` datetime NOT NULL,
	CONSTRAINT `family_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `family_members_family_user_idx` UNIQUE(`family_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `invites` (
	`id` varchar(191) NOT NULL,
	`family_id` varchar(191) NOT NULL,
	`email` varchar(255) NOT NULL,
	`token_hash` varchar(128) NOT NULL,
	`status` varchar(24) NOT NULL DEFAULT 'pending',
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `invites_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` varchar(191) NOT NULL,
	`entry_id` varchar(191) NOT NULL,
	`storage_key` varchar(500) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`byte_size` int NOT NULL DEFAULT 0,
	`checksum` varchar(128),
	`alt_text` varchar(255),
	`status` varchar(24) NOT NULL DEFAULT 'uploaded',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(191) NOT NULL,
	`expires_at` datetime NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(191) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(191) NOT NULL,
	`name` text NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(191) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime,
	`updated_at` datetime,
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `children` ADD CONSTRAINT `children_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entries` ADD CONSTRAINT `entries_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entries` ADD CONSTRAINT `entries_child_id_children_id_fk` FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entries` ADD CONSTRAINT `entries_author_id_user_id_fk` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invites` ADD CONSTRAINT `invites_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photos` ADD CONSTRAINT `photos_entry_id_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `entries_family_date_idx` ON `entries` (`family_id`,`happened_at`);--> statement-breakpoint
CREATE INDEX `entries_child_idx` ON `entries` (`child_id`);--> statement-breakpoint
CREATE INDEX `family_members_family_idx` ON `family_members` (`family_id`);--> statement-breakpoint
CREATE INDEX `photos_entry_idx` ON `photos` (`entry_id`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);