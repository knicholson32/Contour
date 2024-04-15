-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_approachesOptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "airportId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "runway" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "composite" TEXT NOT NULL,
    "custom" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_approachesOptions" ("airportId", "composite", "id", "runway", "tag", "type") SELECT "airportId", "composite", "id", "runway", "tag", "type" FROM "approachesOptions";
DROP TABLE "approachesOptions";
ALTER TABLE "new_approachesOptions" RENAME TO "approachesOptions";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
