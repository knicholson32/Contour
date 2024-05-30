-- CreateTable
CREATE TABLE "navDataSIDSTARRouteSegment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT,
    "airport" TEXT,
    "runway" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fixesOrder" TEXT NOT NULL,
    "navDataSIDSTARRWLeadId" TEXT,
    "navDataSIDSTARTransitionId" TEXT,
    CONSTRAINT "navDataSIDSTARRouteSegment_navDataSIDSTARRWLeadId_fkey" FOREIGN KEY ("navDataSIDSTARRWLeadId") REFERENCES "navDataSIDSTAR" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "navDataSIDSTARRouteSegment_navDataSIDSTARTransitionId_fkey" FOREIGN KEY ("navDataSIDSTARTransitionId") REFERENCES "navDataSIDSTAR" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "navDataSIDSTAR" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "revision" INTEGER NOT NULL,
    "airportsServiced" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_SIDSTARRoute" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SIDSTARRoute_A_fkey" FOREIGN KEY ("A") REFERENCES "navDataNav" ("index") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SIDSTARRoute_B_fkey" FOREIGN KEY ("B") REFERENCES "navDataSIDSTARRouteSegment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_SIDSTARRoute_AB_unique" ON "_SIDSTARRoute"("A", "B");

-- CreateIndex
CREATE INDEX "_SIDSTARRoute_B_index" ON "_SIDSTARRoute"("B");
