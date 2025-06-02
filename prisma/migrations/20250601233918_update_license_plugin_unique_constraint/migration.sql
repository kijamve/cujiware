/*
  Warnings:

  - A unique constraint covering the columns `[license_id,plugin_slug,domain]` on the table `LicensePlugin` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `LicensePlugin_license_id_plugin_slug_key` ON `licenseplugin`;

-- CreateIndex
CREATE UNIQUE INDEX `LicensePlugin_license_id_plugin_slug_domain_key` ON `LicensePlugin`(`license_id`, `plugin_slug`, `domain`);
