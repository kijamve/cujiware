/*
  Warnings:

  - You are about to drop the column `resetToken` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpires` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `resetToken`,
    DROP COLUMN `resetTokenExpires`,
    ADD COLUMN `reset_token` TEXT NULL,
    ADD COLUMN `reset_token_expires` DATETIME(3) NULL;
