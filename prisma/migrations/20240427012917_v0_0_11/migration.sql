-- CreateTable
CREATE TABLE "navDataNav" (
    "index" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "navDataAirway" (
    "index" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "airwayString" TEXT NOT NULL,
    "region" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_NavDataAirwayToNavDataNav" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_NavDataAirwayToNavDataNav_A_fkey" FOREIGN KEY ("A") REFERENCES "navDataAirway" ("index") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_NavDataAirwayToNavDataNav_B_fkey" FOREIGN KEY ("B") REFERENCES "navDataNav" ("index") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_NavDataAirwayToNavDataNav_AB_unique" ON "_NavDataAirwayToNavDataNav"("A", "B");

-- CreateIndex
CREATE INDEX "_NavDataAirwayToNavDataNav_B_index" ON "_NavDataAirwayToNavDataNav"("B");
