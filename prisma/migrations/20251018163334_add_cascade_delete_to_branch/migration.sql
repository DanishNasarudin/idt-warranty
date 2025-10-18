-- DropForeignKey
ALTER TABLE `CaseTransfer` DROP FOREIGN KEY `CaseTransfer_fromBranchId_fkey`;

-- DropForeignKey
ALTER TABLE `CaseTransfer` DROP FOREIGN KEY `CaseTransfer_toBranchId_fkey`;

-- DropForeignKey
ALTER TABLE `WarrantyCase` DROP FOREIGN KEY `WarrantyCase_branchId_fkey`;

-- DropIndex
DROP INDEX `CaseTransfer_toBranchId_fkey` ON `CaseTransfer`;

-- AddForeignKey
ALTER TABLE `WarrantyCase` ADD CONSTRAINT `WarrantyCase_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseTransfer` ADD CONSTRAINT `CaseTransfer_fromBranchId_fkey` FOREIGN KEY (`fromBranchId`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseTransfer` ADD CONSTRAINT `CaseTransfer_toBranchId_fkey` FOREIGN KEY (`toBranchId`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
