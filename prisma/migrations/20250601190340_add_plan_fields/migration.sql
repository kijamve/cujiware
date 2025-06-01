-- AlterTable
ALTER TABLE `plan` ADD COLUMN `is_highlighted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_visible` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `savings_text` VARCHAR(191) NULL;
