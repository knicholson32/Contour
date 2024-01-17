-- CreateTable
CREATE TABLE `tours` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startTime_utc` INTEGER NOT NULL,
    `startTimezone` VARCHAR(191) NOT NULL,
    `startTimezoneOffset` INTEGER NOT NULL,
    `endTime_utc` INTEGER NULL,
    `endTimezone` VARCHAR(191) NULL,
    `endTimezoneOffset` INTEGER NULL,
    `startAirportId` VARCHAR(5) NOT NULL,
    `endAirportId` VARCHAR(5) NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `lineCheck` BOOLEAN NOT NULL,
    `notes` VARCHAR(1024) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `days` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tourId` INTEGER NOT NULL,
    `startTime_utc` INTEGER NOT NULL,
    `startTimezone` VARCHAR(191) NOT NULL,
    `startTimezoneOffset` INTEGER NOT NULL,
    `endTime_utc` INTEGER NOT NULL,
    `endTimezone` VARCHAR(191) NOT NULL,
    `endTimezoneOffset` INTEGER NOT NULL,
    `startAirportId` VARCHAR(5) NOT NULL,
    `endAirportId` VARCHAR(5) NOT NULL,
    `notes` VARCHAR(1024) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `options` (
    `id` VARCHAR(191) NOT NULL,
    `tourId` INTEGER NOT NULL,
    `inaccurateTiming` BOOLEAN NOT NULL,
    `ident` VARCHAR(16) NOT NULL,
    `faFlightId` VARCHAR(191) NOT NULL,
    `operator` VARCHAR(16) NULL,
    `flightNumber` VARCHAR(16) NULL,
    `registration` VARCHAR(16) NULL,
    `inboundFaFlightId` VARCHAR(191) NULL,
    `blocked` BOOLEAN NOT NULL,
    `diverted` BOOLEAN NOT NULL,
    `cancelled` BOOLEAN NOT NULL,
    `positionOnly` BOOLEAN NOT NULL,
    `originAirportId` VARCHAR(5) NULL,
    `destinationAirportId` VARCHAR(5) NULL,
    `diversionAirportId` VARCHAR(5) NULL,
    `departureDelay` INTEGER NULL,
    `arrivalDelay` INTEGER NULL,
    `filedEte` INTEGER NULL,
    `progressPercent` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,
    `aircraftType` VARCHAR(32) NULL,
    `routeDistance` INTEGER NULL,
    `filedAirspeed` INTEGER NULL,
    `filedAltitude` INTEGER NULL,
    `filedRoute` VARCHAR(191) NULL,
    `seatsCabinBusiness` INTEGER NULL,
    `seatsCabinCoach` INTEGER NULL,
    `seatsCabinFirst` INTEGER NULL,
    `gateOrigin` VARCHAR(16) NULL,
    `gateDestination` VARCHAR(16) NULL,
    `terminalOrigin` VARCHAR(16) NULL,
    `terminalDestination` VARCHAR(16) NULL,
    `type` VARCHAR(191) NOT NULL,
    `scheduledOut` INTEGER NULL,
    `scheduledOff` INTEGER NULL,
    `actualOut` INTEGER NULL,
    `actualOff` INTEGER NULL,
    `scheduledIn` INTEGER NULL,
    `scheduledOn` INTEGER NULL,
    `actualIn` INTEGER NULL,
    `actualOn` INTEGER NULL,
    `startTime` INTEGER NOT NULL,
    `endTime` INTEGER NOT NULL,

    UNIQUE INDEX `options_faFlightId_key`(`faFlightId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flightAwareData` (
    `faFlightId` VARCHAR(191) NOT NULL,
    `operator` VARCHAR(16) NULL,
    `flightNumber` VARCHAR(16) NULL,
    `registration` VARCHAR(16) NULL,
    `inboundFaFlightId` VARCHAR(191) NULL,
    `blocked` BOOLEAN NOT NULL,
    `diverted` BOOLEAN NOT NULL,
    `cancelled` BOOLEAN NOT NULL,
    `positionOnly` BOOLEAN NOT NULL,
    `sourceLink` VARCHAR(191) NOT NULL,
    `departureDelay` INTEGER NULL,
    `arrivalDelay` INTEGER NULL,
    `filedEte` INTEGER NULL,
    `progressPercent` INTEGER NULL,
    `status` VARCHAR(64) NOT NULL,
    `aircraftType` VARCHAR(32) NULL,
    `routeDistance` INTEGER NULL,
    `filedAirspeed` INTEGER NULL,
    `filedAltitude` INTEGER NULL,
    `filedRoute` VARCHAR(191) NULL,
    `seatsCabinBusiness` INTEGER NULL,
    `seatsCabinCoach` INTEGER NULL,
    `seatsCabinFirst` INTEGER NULL,
    `gateOrigin` VARCHAR(16) NULL,
    `gateDestination` VARCHAR(16) NULL,
    `terminalOrigin` VARCHAR(16) NULL,
    `terminalDestination` VARCHAR(16) NULL,
    `type` VARCHAR(191) NOT NULL,
    `scheduledOut` INTEGER NULL,
    `scheduledOff` INTEGER NULL,
    `actualOut` INTEGER NULL,
    `actualOff` INTEGER NULL,
    `scheduledIn` INTEGER NULL,
    `scheduledOn` INTEGER NULL,
    `actualIn` INTEGER NULL,
    `actualOn` INTEGER NULL,
    `legId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `flightAwareData_legId_key`(`legId`),
    PRIMARY KEY (`faFlightId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `legs` (
    `id` VARCHAR(191) NOT NULL,
    `dayId` INTEGER NULL,
    `ident` VARCHAR(16) NULL,
    `originAirportId` VARCHAR(5) NOT NULL,
    `destinationAirportId` VARCHAR(5) NOT NULL,
    `diversionAirportId` VARCHAR(5) NULL,
    `startTime` INTEGER NULL,
    `endTime` INTEGER NULL,
    `totalTime` DOUBLE NOT NULL DEFAULT 0,
    `pic` DOUBLE NOT NULL DEFAULT 0,
    `sic` DOUBLE NOT NULL DEFAULT 0,
    `night` DOUBLE NOT NULL DEFAULT 0,
    `solo` DOUBLE NOT NULL DEFAULT 0,
    `xc` DOUBLE NOT NULL DEFAULT 0,
    `distance` DOUBLE NOT NULL DEFAULT 0,
    `dayTakeOffs` INTEGER NOT NULL DEFAULT 0,
    `dayLandings` INTEGER NOT NULL DEFAULT 0,
    `nightTakeOffs` INTEGER NOT NULL DEFAULT 0,
    `nightLandings` INTEGER NOT NULL DEFAULT 0,
    `simulatedInstrument` DOUBLE NOT NULL DEFAULT 0,
    `actualInstrument` DOUBLE NOT NULL DEFAULT 0,
    `holds` INTEGER NOT NULL DEFAULT 0,
    `dualGiven` DOUBLE NOT NULL DEFAULT 0,
    `dualReceived` DOUBLE NOT NULL DEFAULT 0,
    `sim` DOUBLE NOT NULL DEFAULT 0,
    `flightReview` BOOLEAN NOT NULL DEFAULT false,
    `checkride` BOOLEAN NOT NULL DEFAULT false,
    `ipc` BOOLEAN NOT NULL DEFAULT false,
    `faa6158` BOOLEAN NOT NULL DEFAULT false,
    `passengers` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(1024) NOT NULL DEFAULT '',
    `aircraftId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aircraft-types` (
    `id` VARCHAR(191) NOT NULL,
    `typeCode` VARCHAR(191) NOT NULL,
    `subCode` VARCHAR(191) NULL,
    `make` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `catClass` ENUM('ASEL', 'AMEL', 'ASES', 'AMES', 'RH', 'RG', 'GL', 'LA', 'LB', 'PLIFT', 'PL', 'PS', 'WL', 'WS') NOT NULL,
    `gear` ENUM('AM', 'FC', 'FT', 'FL', 'RC', 'RT', 'SK', 'SI') NOT NULL,
    `engine` ENUM('DS', 'EL', 'NP', 'PT', 'RA', 'TF', 'TJ', 'TP', 'TS') NOT NULL,
    `complex` BOOLEAN NOT NULL,
    `taa` BOOLEAN NOT NULL,
    `highPerformance` BOOLEAN NOT NULL,
    `pressurized` BOOLEAN NOT NULL,
    `imageId` VARCHAR(191) NULL,

    UNIQUE INDEX `aircraft-types_imageId_key`(`imageId`),
    UNIQUE INDEX `aircraft-types_typeCode_subCode_key`(`typeCode`, `subCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aircraft` (
    `id` VARCHAR(191) NOT NULL,
    `registration` VARCHAR(191) NOT NULL,
    `aircraftTypeId` VARCHAR(191) NOT NULL,
    `year` INTEGER NULL,
    `serial` VARCHAR(191) NULL,
    `simulator` BOOLEAN NOT NULL DEFAULT false,
    `complex` BOOLEAN NULL,
    `taa` BOOLEAN NULL,
    `highPerformance` BOOLEAN NULL,
    `pressurized` BOOLEAN NULL,
    `notes` VARCHAR(191) NULL,
    `imageId` VARCHAR(191) NULL,

    UNIQUE INDEX `aircraft_registration_key`(`registration`),
    UNIQUE INDEX `aircraft_imageId_key`(`imageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `images` (
    `id` VARCHAR(191) NOT NULL,
    `original` LONGBLOB NOT NULL,
    `fullJpeg` LONGBLOB NOT NULL,
    `fullAvif` LONGBLOB NOT NULL,
    `i2048Jpeg` LONGBLOB NOT NULL,
    `i2048Avif` LONGBLOB NOT NULL,
    `i1024Jpeg` LONGBLOB NOT NULL,
    `i1024Avif` LONGBLOB NOT NULL,
    `i768Jpeg` LONGBLOB NOT NULL,
    `i768Avif` LONGBLOB NOT NULL,
    `i512Jpeg` LONGBLOB NOT NULL,
    `i512Avif` LONGBLOB NOT NULL,
    `i256Jpeg` LONGBLOB NOT NULL,
    `i256Avif` LONGBLOB NOT NULL,
    `i128Jpeg` LONGBLOB NOT NULL,
    `i128Avif` LONGBLOB NOT NULL,

    UNIQUE INDEX `images_id_key`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `airports` (
    `id` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `infoURL` VARCHAR(191) NULL,
    `latitude` DECIMAL(65, 30) NOT NULL,
    `longitude` DECIMAL(65, 30) NOT NULL,
    `countryCode` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `airports_latitude_longitude_key`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `positions` (
    `legId` VARCHAR(191) NOT NULL,
    `altitude` INTEGER NOT NULL,
    `altitudeChange` ENUM('CLIMBING', 'DESCENDING', 'LEVEL', 'UNKNOWN') NOT NULL,
    `groundspeed` INTEGER NOT NULL,
    `heading` INTEGER NOT NULL,
    `latitude` DECIMAL(65, 30) NOT NULL,
    `longitude` DECIMAL(65, 30) NOT NULL,
    `timestamp` INTEGER NOT NULL,
    `updateType` ENUM('PROJECTED', 'OCEANIC', 'RADAR', 'ADSB', 'MULTILATERATION', 'DATALINK', 'ADSB_ASDEX', 'SPACE', 'UNKNOWN') NULL,

    UNIQUE INDEX `positions_legId_timestamp_latitude_longitude_key`(`legId`, `timestamp`, `latitude`, `longitude`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fixes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `legId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(65, 30) NULL,
    `longitude` DECIMAL(65, 30) NULL,
    `distanceFromOrigin` DECIMAL(65, 30) NULL,
    `distanceThisLeg` DECIMAL(65, 30) NULL,
    `distanceToDestination` DECIMAL(65, 30) NULL,
    `outboundCourse` INTEGER NULL,
    `type` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tours` ADD CONSTRAINT `tours_startAirportId_fkey` FOREIGN KEY (`startAirportId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tours` ADD CONSTRAINT `tours_endAirportId_fkey` FOREIGN KEY (`endAirportId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `days` ADD CONSTRAINT `days_tourId_fkey` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `days` ADD CONSTRAINT `days_startAirportId_fkey` FOREIGN KEY (`startAirportId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `days` ADD CONSTRAINT `days_endAirportId_fkey` FOREIGN KEY (`endAirportId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `options` ADD CONSTRAINT `options_tourId_fkey` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flightAwareData` ADD CONSTRAINT `flightAwareData_legId_fkey` FOREIGN KEY (`legId`) REFERENCES `legs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `legs` ADD CONSTRAINT `legs_dayId_fkey` FOREIGN KEY (`dayId`) REFERENCES `days`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `legs` ADD CONSTRAINT `legs_originAirportId_fkey` FOREIGN KEY (`originAirportId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `legs` ADD CONSTRAINT `legs_destinationAirportId_fkey` FOREIGN KEY (`destinationAirportId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `legs` ADD CONSTRAINT `legs_diversionAirportId_fkey` FOREIGN KEY (`diversionAirportId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `legs` ADD CONSTRAINT `legs_aircraftId_fkey` FOREIGN KEY (`aircraftId`) REFERENCES `aircraft`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aircraft-types` ADD CONSTRAINT `aircraft-types_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `images`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aircraft` ADD CONSTRAINT `aircraft_aircraftTypeId_fkey` FOREIGN KEY (`aircraftTypeId`) REFERENCES `aircraft-types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aircraft` ADD CONSTRAINT `aircraft_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `images`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `positions` ADD CONSTRAINT `positions_legId_fkey` FOREIGN KEY (`legId`) REFERENCES `legs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fixes` ADD CONSTRAINT `fixes_legId_fkey` FOREIGN KEY (`legId`) REFERENCES `legs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
