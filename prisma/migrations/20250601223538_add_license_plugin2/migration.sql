/*
  Warnings:

  - You are about to drop the column `plugin_slug` on the `licenseusage` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `LicenseUsage_plugin_slug_idx` ON `licenseusage`;

-- AlterTable
ALTER TABLE `licenseusage` DROP COLUMN `plugin_slug`;
