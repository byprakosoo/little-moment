ALTER TABLE `families` ADD COLUMN IF NOT EXISTS `owner_label` varchar(40) DEFAULT 'Baba' NOT NULL;--> statement-breakpoint
ALTER TABLE `families` ADD COLUMN IF NOT EXISTS `member_label` varchar(40) DEFAULT 'Bubu' NOT NULL;
