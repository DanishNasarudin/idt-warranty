-- CreateTable
CREATE TABLE `Branch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(16) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Branch_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CaseScope` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CaseScope_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Staff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `color` VARCHAR(32) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Staff_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffOnBranch` (
    `staffId` INTEGER NOT NULL,
    `branchId` INTEGER NOT NULL,

    INDEX `StaffOnBranch_branchId_idx`(`branchId`),
    PRIMARY KEY (`staffId`, `branchId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WarrantyCase` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceNo` VARCHAR(64) NOT NULL,
    `branchId` INTEGER NOT NULL,
    `scopeId` INTEGER NOT NULL,
    `status` ENUM('IN_QUEUE', 'IN_PROGRESS', 'WAITING_FOR', 'COMPLETED') NOT NULL DEFAULT 'IN_QUEUE',
    `customerName` VARCHAR(100) NULL,
    `customerContact` VARCHAR(40) NULL,
    `customerEmail` VARCHAR(254) NULL,
    `address` TEXT NULL,
    `purchaseDate` DATETIME(3) NULL,
    `invoice` VARCHAR(100) NULL,
    `receivedItems` VARCHAR(250) NULL,
    `pin` TEXT NULL,
    `issues` TEXT NULL,
    `solutions` TEXT NULL,
    `statusDesc` TEXT NULL,
    `remarks` TEXT NULL,
    `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `locker` INTEGER NULL,
    `idtPc` BOOLEAN NULL,
    `receivedByStaffId` INTEGER NULL,
    `servicedByStaffId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ix_branch_status_createdAt`(`branchId`, `status`, `createdAt`),
    INDEX `ix_customerEmail`(`customerEmail`),
    INDEX `ix_serviceNo`(`serviceNo`),
    UNIQUE INDEX `WarrantyCase_serviceNo_branchId_scopeId_key`(`serviceNo`, `branchId`, `scopeId`),
    FULLTEXT INDEX `ft_issues_solutions`(`issues`, `solutions`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WarrantyHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caseId` INTEGER NOT NULL,
    `changeType` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    `changeTs` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `changedByStaffId` INTEGER NULL,
    `snapshotJson` TEXT NULL,

    INDEX `ix_case_changeTs`(`caseId`, `changeTs`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileStore` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileName` VARCHAR(255) NULL,
    `mimeType` VARCHAR(127) NULL,
    `sizeBytes` INTEGER NULL,
    `sha256` CHAR(64) NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `data` LONGBLOB NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FileStore_sha256_key`(`sha256`),
    INDEX `FileStore_fileName_idx`(`fileName`),
    INDEX `FileStore_mimeType_idx`(`mimeType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WarrantyCaseFile` (
    `caseId` INTEGER NOT NULL,
    `fileId` INTEGER NOT NULL,

    INDEX `WarrantyCaseFile_fileId_idx`(`fileId`),
    PRIMARY KEY (`caseId`, `fileId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StaffOnBranch` ADD CONSTRAINT `StaffOnBranch_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffOnBranch` ADD CONSTRAINT `StaffOnBranch_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WarrantyCase` ADD CONSTRAINT `WarrantyCase_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WarrantyCase` ADD CONSTRAINT `WarrantyCase_scopeId_fkey` FOREIGN KEY (`scopeId`) REFERENCES `CaseScope`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WarrantyCase` ADD CONSTRAINT `WarrantyCase_receivedByStaffId_fkey` FOREIGN KEY (`receivedByStaffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE `WarrantyCase` ADD CONSTRAINT `WarrantyCase_servicedByStaffId_fkey` FOREIGN KEY (`servicedByStaffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE `WarrantyHistory` ADD CONSTRAINT `WarrantyHistory_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `WarrantyCase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WarrantyHistory` ADD CONSTRAINT `WarrantyHistory_changedByStaffId_fkey` FOREIGN KEY (`changedByStaffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE `WarrantyCaseFile` ADD CONSTRAINT `WarrantyCaseFile_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `WarrantyCase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WarrantyCaseFile` ADD CONSTRAINT `WarrantyCaseFile_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `FileStore`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
