/*
  Warnings:

  - You are about to alter the column `status` on the `license` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - You are about to alter the column `status` on the `membership` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - You are about to alter the column `payment_method` on the `membership` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(5))`.
  - You are about to alter the column `status` on the `payment` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.
  - You are about to alter the column `payment_method` on the `payment` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(5))`.
  - You are about to alter the column `interval` on the `plan` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `license` MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'REVOKED') NOT NULL;

-- AlterTable
ALTER TABLE `membership` MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'CANCELLED') NOT NULL,
    MODIFY `payment_method` ENUM('STRIPE', 'VENEZUELA') NOT NULL;

-- AlterTable
ALTER TABLE `payment` MODIFY `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL,
    MODIFY `payment_method` ENUM('STRIPE', 'VENEZUELA') NOT NULL;

-- AlterTable
ALTER TABLE `plan` MODIFY `interval` ENUM('MONTH', 'SEMESTER', 'YEAR') NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `resetToken` TEXT NULL,
    ADD COLUMN `resetTokenExpires` DATETIME(3) NULL;
