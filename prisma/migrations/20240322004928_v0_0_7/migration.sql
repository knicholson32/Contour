-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_legs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" INTEGER,
    "route" TEXT,
    "forceUseBlock" BOOLEAN NOT NULL DEFAULT false,
    "ident" TEXT,
    "originAirportId" TEXT,
    "destinationAirportId" TEXT,
    "diversionAirportId" TEXT,
    "startTime_utc" INTEGER,
    "endTime_utc" INTEGER,
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
INSERT INTO "new_legs" ("actualInstrument", "aircraftId", "checkride", "dayId", "dayLandings", "dayTakeOffs", "destinationAirportId", "distance", "diversionAirportId", "dualGiven", "dualReceived", "endTime_utc", "faa6158", "flightReview", "holds", "id", "ident", "ipc", "night", "nightLandings", "nightTakeOffs", "notes", "originAirportId", "passengers", "pic", "relativeOrder", "route", "sic", "sim", "simulatedInstrument", "solo", "startTime_utc", "totalTime", "xc") SELECT "actualInstrument", "aircraftId", "checkride", "dayId", "dayLandings", "dayTakeOffs", "destinationAirportId", "distance", "diversionAirportId", "dualGiven", "dualReceived", "endTime_utc", "faa6158", "flightReview", "holds", "id", "ident", "ipc", "night", "nightLandings", "nightTakeOffs", "notes", "originAirportId", "passengers", "pic", "relativeOrder", "route", "sic", "sim", "simulatedInstrument", "solo", "startTime_utc", "totalTime", "xc" FROM "legs";
DROP TABLE "legs";
ALTER TABLE "new_legs" RENAME TO "legs";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
