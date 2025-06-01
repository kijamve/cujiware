/*
  Warnings:

  - Added the required column `plugin_slug` to the `LicenseUsage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `licenseusage` ADD COLUMN `plugin_slug` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `LicensePlugin` (
    `id` VARCHAR(191) NOT NULL,
    `license_id` VARCHAR(191) NOT NULL,
    `plugin_slug` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `last_usage` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `LicensePlugin_license_id_idx`(`license_id`),
    INDEX `LicensePlugin_plugin_slug_idx`(`plugin_slug`),
    UNIQUE INDEX `LicensePlugin_license_id_plugin_slug_key`(`license_id`, `plugin_slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `LicenseUsage_plugin_slug_idx` ON `LicenseUsage`(`plugin_slug`);

-- AddForeignKey
ALTER TABLE `LicensePlugin` ADD CONSTRAINT `LicensePlugin_license_id_fkey` FOREIGN KEY (`license_id`) REFERENCES `License`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
