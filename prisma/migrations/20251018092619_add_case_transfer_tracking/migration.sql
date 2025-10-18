-- AlterTable
ALTER TABLE `WarrantyCase` ADD COLUMN `originBranchId` INTEGER NULL;

-- CreateTable
CREATE TABLE `CaseTransfer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caseId` INTEGER NOT NULL,
    `fromBranchId` INTEGER NOT NULL,
    `toBranchId` INTEGER NOT NULL,
    `transferredByStaffId` INTEGER NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `reason` TEXT NULL,
    `notes` TEXT NULL,
    `transferredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acceptedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ix_caseId`(`caseId`),
    INDEX `ix_from_to_branch`(`fromBranchId`, `toBranchId`),
    INDEX `ix_status`(`status`),
    INDEX `ix_transferredAt`(`transferredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ix_originBranchId` ON `WarrantyCase`(`originBranchId`);

-- AddForeignKey
ALTER TABLE `WarrantyCase` ADD CONSTRAINT `WarrantyCase_originBranchId_fkey` FOREIGN KEY (`originBranchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE `CaseTransfer` ADD CONSTRAINT `CaseTransfer_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `WarrantyCase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseTransfer` ADD CONSTRAINT `CaseTransfer_fromBranchId_fkey` FOREIGN KEY (`fromBranchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseTransfer` ADD CONSTRAINT `CaseTransfer_toBranchId_fkey` FOREIGN KEY (`toBranchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseTransfer` ADD CONSTRAINT `CaseTransfer_transferredByStaffId_fkey` FOREIGN KEY (`transferredByStaffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE SET NULL;
