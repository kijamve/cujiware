-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `billing_full_name` VARCHAR(191) NULL,
    `billing_phone` VARCHAR(191) NULL,
    `billing_tax_id` VARCHAR(191) NULL,
    `billing_address` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Membership` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `stripe_subscription_id` VARCHAR(191) NULL,
    `payment_method` VARCHAR(191) NOT NULL,
    `last_check_with_gateway` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Membership_user_id_idx`(`user_id`),
    INDEX `Membership_plan_id_idx`(`plan_id`),
    INDEX `Membership_stripe_subscription_id_idx`(`stripe_subscription_id`),
    INDEX `Membership_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `License` (
    `id` VARCHAR(191) NOT NULL,
    `membership_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `last_reset` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `License_membership_id_idx`(`membership_id`),
    INDEX `License_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LicenseUsage` (
    `id` VARCHAR(191) NOT NULL,
    `license_id` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `first_used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_used_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `LicenseUsage_license_id_idx`(`license_id`),
    INDEX `LicenseUsage_domain_idx`(`domain`),
    UNIQUE INDEX `LicenseUsage_license_id_domain_key`(`license_id`, `domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    UNIQUE INDEX `LicensePlugin_license_id_plugin_slug_domain_key`(`license_id`, `plugin_slug`, `domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Plan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `interval` VARCHAR(191) NOT NULL,
    `features` JSON NOT NULL,
    `stripe_price_id` VARCHAR(191) NULL,
    `is_highlighted` BOOLEAN NOT NULL DEFAULT false,
    `savings_text` VARCHAR(191) NULL,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Plan_stripe_price_id_key`(`stripe_price_id`),
    INDEX `Plan_interval_idx`(`interval`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PluginVersion` (
    `id` VARCHAR(191) NOT NULL,
    `plugin_slug` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_path_server` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `PluginVersion_plugin_slug_idx`(`plugin_slug`),
    UNIQUE INDEX `PluginVersion_plugin_slug_version_key`(`plugin_slug`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `membership_id` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `payment_method` VARCHAR(191) NOT NULL,
    `stripe_invoice_id` VARCHAR(191) NULL,
    `bank_name` VARCHAR(191) NULL,
    `currency_rate` DOUBLE NULL,
    `reference` VARCHAR(191) NULL,
    `invoice_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Payment_membership_id_idx`(`membership_id`),
    INDEX `Payment_status_idx`(`status`),
    INDEX `Payment_payment_method_idx`(`payment_method`),
    INDEX `Payment_stripe_invoice_id_idx`(`stripe_invoice_id`),
    INDEX `Payment_reference_idx`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Membership` ADD CONSTRAINT `Membership_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Membership` ADD CONSTRAINT `Membership_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `License` ADD CONSTRAINT `License_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `Membership`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LicenseUsage` ADD CONSTRAINT `LicenseUsage_license_id_fkey` FOREIGN KEY (`license_id`) REFERENCES `License`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LicensePlugin` ADD CONSTRAINT `LicensePlugin_license_id_fkey` FOREIGN KEY (`license_id`) REFERENCES `License`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `Membership`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
