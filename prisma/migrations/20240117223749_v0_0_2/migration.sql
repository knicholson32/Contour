/*
  Warnings:

  - You are about to alter the column `latitude` on the `airports` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `longitude` on the `airports` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `latitude` on the `fixes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `longitude` on the `fixes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `distanceFromOrigin` on the `fixes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `distanceThisLeg` on the `fixes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `distanceToDestination` on the `fixes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to drop the column `endTime` on the `legs` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `legs` table. All the data in the column will be lost.
  - You are about to alter the column `latitude` on the `positions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `longitude` on the `positions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.

*/
-- AlterTable
ALTER TABLE `airports` MODIFY `latitude` DOUBLE NOT NULL,
    MODIFY `longitude` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `fixes` MODIFY `latitude` DOUBLE NULL,
    MODIFY `longitude` DOUBLE NULL,
    MODIFY `distanceFromOrigin` DOUBLE NULL,
    MODIFY `distanceThisLeg` DOUBLE NULL,
    MODIFY `distanceToDestination` DOUBLE NULL;

-- AlterTable
ALTER TABLE `legs` DROP COLUMN `endTime`,
    DROP COLUMN `startTime`,
    ADD COLUMN `endTime_utc` INTEGER NULL,
    ADD COLUMN `startTime_utc` INTEGER NULL;

-- AlterTable
ALTER TABLE `positions` MODIFY `latitude` DOUBLE NOT NULL,
    MODIFY `longitude` DOUBLE NOT NULL;

-- CreateTable
CREATE TABLE `deadheads` (
    `id` VARCHAR(191) NOT NULL,
    `dayId` INTEGER NULL,
    `originAirportId` VARCHAR(5) NOT NULL,
    `destinationAirportId` VARCHAR(5) NOT NULL,
    `startTime_utc` INTEGER NOT NULL,
    `endTime_utc` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `deadheads` ADD CONSTRAINT `deadheads_dayId_fkey` FOREIGN KEY (`dayId`) REFERENCES `days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deadheads` ADD CONSTRAINT `deadheads_originAirportId_fkey` FOREIGN KEY (`originAirportId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deadheads` ADD CONSTRAINT `deadheads_destinationAirportId_fkey` FOREIGN KEY (`destinationAirportId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
