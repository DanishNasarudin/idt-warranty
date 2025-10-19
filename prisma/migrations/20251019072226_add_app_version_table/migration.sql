-- CreateTable
CREATE TABLE `AppVersion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `version` VARCHAR(32) NOT NULL,
    `buildTimestamp` VARCHAR(64) NOT NULL,
    `commitHash` VARCHAR(64) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `deployedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AppVersion_buildTimestamp_key`(`buildTimestamp`),
    INDEX `ix_active`(`isActive`),
    INDEX `ix_deployedAt`(`deployedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
