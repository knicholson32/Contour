-- CreateTable
CREATE TABLE "approaches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "runway" TEXT,
    "tag" TEXT,
    "composite" TEXT NOT NULL,
    "circleToLand" BOOLEAN NOT NULL,
    "notes" TEXT,
    "legId" TEXT,
    "airportId" TEXT NOT NULL,
    CONSTRAINT "approaches_legId_fkey" FOREIGN KEY ("legId") REFERENCES "legs" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "approaches_airportId_fkey" FOREIGN KEY ("airportId") REFERENCES "airports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "approachesOptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "airportId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "runway" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "composite" TEXT NOT NULL
);
