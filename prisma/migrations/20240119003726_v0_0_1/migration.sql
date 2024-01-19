-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_images" (
    "id" TEXT NOT NULL,
    "original" TEXT NOT NULL,
    "fullJpeg" TEXT NOT NULL,
    "fullAvif" TEXT NOT NULL,
    "i2048Jpeg" TEXT NOT NULL,
    "i2048Avif" TEXT NOT NULL,
    "i1024Jpeg" TEXT NOT NULL,
    "i1024Avif" TEXT NOT NULL,
    "i768Jpeg" TEXT NOT NULL,
    "i768Avif" TEXT NOT NULL,
    "i512Jpeg" TEXT NOT NULL,
    "i512Avif" TEXT NOT NULL,
    "i256Jpeg" BLOB NOT NULL,
    "i256Avif" BLOB NOT NULL,
    "i128Jpeg" BLOB NOT NULL,
    "i128Avif" BLOB NOT NULL
);
INSERT INTO "new_images" ("fullAvif", "fullJpeg", "i1024Avif", "i1024Jpeg", "i128Avif", "i128Jpeg", "i2048Avif", "i2048Jpeg", "i256Avif", "i256Jpeg", "i512Avif", "i512Jpeg", "i768Avif", "i768Jpeg", "id", "original") SELECT "fullAvif", "fullJpeg", "i1024Avif", "i1024Jpeg", "i128Avif", "i128Jpeg", "i2048Avif", "i2048Jpeg", "i256Avif", "i256Jpeg", "i512Avif", "i512Jpeg", "i768Avif", "i768Jpeg", "id", "original" FROM "images";
DROP TABLE "images";
ALTER TABLE "new_images" RENAME TO "images";
CREATE UNIQUE INDEX "images_id_key" ON "images"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
