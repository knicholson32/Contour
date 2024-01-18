-- CreateTable
CREATE TABLE "tours" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startTime_utc" INTEGER NOT NULL,
    "startTimezone" TEXT NOT NULL,
    "startTimezoneOffset" INTEGER NOT NULL,
    "endTime_utc" INTEGER,
    "endTimezone" TEXT,
    "endTimezoneOffset" INTEGER,
    "startAirportId" TEXT NOT NULL,
    "endAirportId" TEXT,
    "companyId" TEXT NOT NULL,
    "lineCheck" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "tours_startAirportId_fkey" FOREIGN KEY ("startAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tours_endAirportId_fkey" FOREIGN KEY ("endAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "days" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tourId" INTEGER NOT NULL,
    "startTime_utc" INTEGER NOT NULL,
    "startTimezone" TEXT NOT NULL,
    "startTimezoneOffset" INTEGER NOT NULL,
    "endTime_utc" INTEGER NOT NULL,
    "endTimezone" TEXT NOT NULL,
    "endTimezoneOffset" INTEGER NOT NULL,
    "startAirportId" TEXT NOT NULL,
    "endAirportId" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "days_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "days_startAirportId_fkey" FOREIGN KEY ("startAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "days_endAirportId_fkey" FOREIGN KEY ("endAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tourId" INTEGER NOT NULL,
    "inaccurateTiming" BOOLEAN NOT NULL,
    "ident" TEXT NOT NULL,
    "faFlightId" TEXT NOT NULL,
    "operator" TEXT,
    "flightNumber" TEXT,
    "registration" TEXT,
    "inboundFaFlightId" TEXT,
    "blocked" BOOLEAN NOT NULL,
    "diverted" BOOLEAN NOT NULL,
    "cancelled" BOOLEAN NOT NULL,
    "positionOnly" BOOLEAN NOT NULL,
    "originAirportId" TEXT,
    "destinationAirportId" TEXT,
    "diversionAirportId" TEXT,
    "departureDelay" INTEGER,
    "arrivalDelay" INTEGER,
    "filedEte" INTEGER,
    "progressPercent" INTEGER,
    "status" TEXT NOT NULL,
    "aircraftType" TEXT,
    "routeDistance" INTEGER,
    "filedAirspeed" INTEGER,
    "filedAltitude" INTEGER,
    "filedRoute" TEXT,
    "seatsCabinBusiness" INTEGER,
    "seatsCabinCoach" INTEGER,
    "seatsCabinFirst" INTEGER,
    "gateOrigin" TEXT,
    "gateDestination" TEXT,
    "terminalOrigin" TEXT,
    "terminalDestination" TEXT,
    "type" TEXT NOT NULL,
    "scheduledOut" INTEGER,
    "scheduledOff" INTEGER,
    "actualOut" INTEGER,
    "actualOff" INTEGER,
    "scheduledIn" INTEGER,
    "scheduledOn" INTEGER,
    "actualIn" INTEGER,
    "actualOn" INTEGER,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    CONSTRAINT "options_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "flightAwareData" (
    "faFlightId" TEXT NOT NULL PRIMARY KEY,
    "operator" TEXT,
    "flightNumber" TEXT,
    "registration" TEXT,
    "inboundFaFlightId" TEXT,
    "blocked" BOOLEAN NOT NULL,
    "diverted" BOOLEAN NOT NULL,
    "cancelled" BOOLEAN NOT NULL,
    "positionOnly" BOOLEAN NOT NULL,
    "sourceLink" TEXT NOT NULL,
    "departureDelay" INTEGER,
    "arrivalDelay" INTEGER,
    "filedEte" INTEGER,
    "progressPercent" INTEGER,
    "status" TEXT NOT NULL,
    "aircraftType" TEXT,
    "routeDistance" INTEGER,
    "filedAirspeed" INTEGER,
    "filedAltitude" INTEGER,
    "filedRoute" TEXT,
    "seatsCabinBusiness" INTEGER,
    "seatsCabinCoach" INTEGER,
    "seatsCabinFirst" INTEGER,
    "gateOrigin" TEXT,
    "gateDestination" TEXT,
    "terminalOrigin" TEXT,
    "terminalDestination" TEXT,
    "type" TEXT NOT NULL,
    "scheduledOut" INTEGER,
    "scheduledOff" INTEGER,
    "actualOut" INTEGER,
    "actualOff" INTEGER,
    "scheduledIn" INTEGER,
    "scheduledOn" INTEGER,
    "actualIn" INTEGER,
    "actualOn" INTEGER,
    "legId" TEXT NOT NULL,
    CONSTRAINT "flightAwareData_legId_fkey" FOREIGN KEY ("legId") REFERENCES "legs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "legs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" INTEGER,
    "ident" TEXT,
    "originAirportId" TEXT NOT NULL,
    "destinationAirportId" TEXT NOT NULL,
    "diversionAirportId" TEXT,
    "startTime_utc" INTEGER,
    "endTime_utc" INTEGER,
    "totalTime" REAL NOT NULL DEFAULT 0,
    "pic" REAL NOT NULL DEFAULT 0,
    "sic" REAL NOT NULL DEFAULT 0,
    "night" REAL NOT NULL DEFAULT 0,
    "solo" REAL NOT NULL DEFAULT 0,
    "xc" REAL NOT NULL DEFAULT 0,
    "distance" REAL NOT NULL DEFAULT 0,
    "dayTakeOffs" INTEGER NOT NULL DEFAULT 0,
    "dayLandings" INTEGER NOT NULL DEFAULT 0,
    "nightTakeOffs" INTEGER NOT NULL DEFAULT 0,
    "nightLandings" INTEGER NOT NULL DEFAULT 0,
    "simulatedInstrument" REAL NOT NULL DEFAULT 0,
    "actualInstrument" REAL NOT NULL DEFAULT 0,
    "holds" INTEGER NOT NULL DEFAULT 0,
    "dualGiven" REAL NOT NULL DEFAULT 0,
    "dualReceived" REAL NOT NULL DEFAULT 0,
    "sim" REAL NOT NULL DEFAULT 0,
    "flightReview" BOOLEAN NOT NULL DEFAULT false,
    "checkride" BOOLEAN NOT NULL DEFAULT false,
    "ipc" BOOLEAN NOT NULL DEFAULT false,
    "faa6158" BOOLEAN NOT NULL DEFAULT false,
    "passengers" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "aircraftId" TEXT NOT NULL,
    CONSTRAINT "legs_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "days" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "legs_originAirportId_fkey" FOREIGN KEY ("originAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "legs_destinationAirportId_fkey" FOREIGN KEY ("destinationAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "legs_diversionAirportId_fkey" FOREIGN KEY ("diversionAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "legs_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "aircraft" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "deadheads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" INTEGER,
    "originAirportId" TEXT NOT NULL,
    "destinationAirportId" TEXT NOT NULL,
    "startTime_utc" INTEGER NOT NULL,
    "endTime_utc" INTEGER NOT NULL,
    CONSTRAINT "deadheads_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "days" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "deadheads_originAirportId_fkey" FOREIGN KEY ("originAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "deadheads_destinationAirportId_fkey" FOREIGN KEY ("destinationAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "setting" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "aircraft-types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typeCode" TEXT NOT NULL,
    "subCode" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "catClass" TEXT NOT NULL,
    "gear" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "complex" BOOLEAN NOT NULL,
    "taa" BOOLEAN NOT NULL,
    "highPerformance" BOOLEAN NOT NULL,
    "pressurized" BOOLEAN NOT NULL,
    "imageId" TEXT,
    CONSTRAINT "aircraft-types_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "aircraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration" TEXT NOT NULL,
    "aircraftTypeId" TEXT NOT NULL,
    "year" INTEGER,
    "serial" TEXT,
    "simulator" BOOLEAN NOT NULL DEFAULT false,
    "complex" BOOLEAN,
    "taa" BOOLEAN,
    "highPerformance" BOOLEAN,
    "pressurized" BOOLEAN,
    "notes" TEXT,
    "imageId" TEXT,
    CONSTRAINT "aircraft_aircraftTypeId_fkey" FOREIGN KEY ("aircraftTypeId") REFERENCES "aircraft-types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "aircraft_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "original" BLOB NOT NULL,
    "fullJpeg" BLOB NOT NULL,
    "fullAvif" BLOB NOT NULL,
    "i2048Jpeg" BLOB NOT NULL,
    "i2048Avif" BLOB NOT NULL,
    "i1024Jpeg" BLOB NOT NULL,
    "i1024Avif" BLOB NOT NULL,
    "i768Jpeg" BLOB NOT NULL,
    "i768Avif" BLOB NOT NULL,
    "i512Jpeg" BLOB NOT NULL,
    "i512Avif" BLOB NOT NULL,
    "i256Jpeg" BLOB NOT NULL,
    "i256Avif" BLOB NOT NULL,
    "i128Jpeg" BLOB NOT NULL,
    "i128Avif" BLOB NOT NULL
);

-- CreateTable
CREATE TABLE "airports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timezone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "infoURL" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "countryCode" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "positions" (
    "legId" TEXT NOT NULL,
    "altitude" INTEGER NOT NULL,
    "altitudeChange" TEXT NOT NULL,
    "groundspeed" INTEGER NOT NULL,
    "heading" INTEGER NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "updateType" TEXT,
    CONSTRAINT "positions_legId_fkey" FOREIGN KEY ("legId") REFERENCES "legs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fixes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "distanceFromOrigin" REAL,
    "distanceThisLeg" REAL,
    "distanceToDestination" REAL,
    "outboundCourse" INTEGER,
    "type" TEXT NOT NULL,
    CONSTRAINT "fixes_legId_fkey" FOREIGN KEY ("legId") REFERENCES "legs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "options_faFlightId_key" ON "options"("faFlightId");

-- CreateIndex
CREATE UNIQUE INDEX "flightAwareData_legId_key" ON "flightAwareData"("legId");

-- CreateIndex
CREATE UNIQUE INDEX "aircraft-types_imageId_key" ON "aircraft-types"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "aircraft-types_typeCode_subCode_key" ON "aircraft-types"("typeCode", "subCode");

-- CreateIndex
CREATE UNIQUE INDEX "aircraft_registration_key" ON "aircraft"("registration");

-- CreateIndex
CREATE UNIQUE INDEX "aircraft_imageId_key" ON "aircraft"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "images_id_key" ON "images"("id");

-- CreateIndex
CREATE UNIQUE INDEX "airports_latitude_longitude_key" ON "airports"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "positions_legId_timestamp_latitude_longitude_key" ON "positions"("legId", "timestamp", "latitude", "longitude");
