-- CreateTable
CREATE TABLE "prospectMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startLatitude" REAL NOT NULL,
    "startLongitude" REAL NOT NULL,
    "endLatitude" REAL NOT NULL,
    "endLongitude" REAL NOT NULL,
    "startAirportId" TEXT,
    "endAirportId" TEXT,
    "startTime_utc" INTEGER NOT NULL,
    "endTime_utc" INTEGER NOT NULL,
    "distance_km" REAL,
    "preview" TEXT,
    CONSTRAINT "prospectMetadata_startAirportId_fkey" FOREIGN KEY ("startAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "prospectMetadata_endAirportId_fkey" FOREIGN KEY ("endAirportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prospectPositions" (
    "trackId" TEXT NOT NULL,
    "altitude" INTEGER NOT NULL,
    "altitudeChange" TEXT NOT NULL,
    "groundspeed" INTEGER NOT NULL,
    "heading" INTEGER NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "timestamp" INTEGER NOT NULL,
    CONSTRAINT "prospectPositions_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "prospectMetadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_legs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" INTEGER,
    "route" TEXT,
    "useBlock" BOOLEAN NOT NULL,
    "positionsFromTracker" BOOLEAN NOT NULL DEFAULT false,
    "ident" TEXT,
    "originAirportId" TEXT,
    "destinationAirportId" TEXT,
    "diversionAirportId" TEXT,
    "startTime_utc" INTEGER NOT NULL,
    "endTime_utc" INTEGER NOT NULL,
    "relativeOrder" INTEGER NOT NULL DEFAULT 0,
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
    "crossing" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_legs" ("actualInstrument", "aircraftId", "checkride", "crossing", "dayId", "dayLandings", "dayTakeOffs", "destinationAirportId", "distance", "diversionAirportId", "dualGiven", "dualReceived", "endTime_utc", "faa6158", "flightReview", "holds", "id", "ident", "ipc", "night", "nightLandings", "nightTakeOffs", "notes", "originAirportId", "passengers", "pic", "relativeOrder", "route", "sic", "simulatedInstrument", "solo", "startTime_utc", "totalTime", "useBlock", "xc") SELECT "actualInstrument", "aircraftId", "checkride", "crossing", "dayId", "dayLandings", "dayTakeOffs", "destinationAirportId", "distance", "diversionAirportId", "dualGiven", "dualReceived", "endTime_utc", "faa6158", "flightReview", "holds", "id", "ident", "ipc", "night", "nightLandings", "nightTakeOffs", "notes", "originAirportId", "passengers", "pic", "relativeOrder", "route", "sic", "simulatedInstrument", "solo", "startTime_utc", "totalTime", "useBlock", "xc" FROM "legs";
DROP TABLE "legs";
ALTER TABLE "new_legs" RENAME TO "legs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "prospectPositions_trackId_timestamp_latitude_longitude_key" ON "prospectPositions"("trackId", "timestamp", "latitude", "longitude");
