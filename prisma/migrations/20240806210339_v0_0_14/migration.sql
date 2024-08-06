-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_aircraft-types" (
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
    "typeRatingRequired" BOOLEAN NOT NULL DEFAULT false,
    "imageId" TEXT,
    CONSTRAINT "aircraft-types_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_aircraft-types" ("catClass", "complex", "engine", "gear", "highPerformance", "id", "imageId", "make", "model", "pressurized", "subCode", "taa", "typeCode") SELECT "catClass", "complex", "engine", "gear", "highPerformance", "id", "imageId", "make", "model", "pressurized", "subCode", "taa", "typeCode" FROM "aircraft-types";
DROP TABLE "aircraft-types";
ALTER TABLE "new_aircraft-types" RENAME TO "aircraft-types";
CREATE UNIQUE INDEX "aircraft-types_imageId_key" ON "aircraft-types"("imageId");
CREATE UNIQUE INDEX "aircraft-types_typeCode_subCode_key" ON "aircraft-types"("typeCode", "subCode");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
