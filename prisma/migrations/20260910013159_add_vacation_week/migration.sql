-- CreateTable
CREATE TABLE "vacation_weeks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT ''
);

-- CreateIndex
CREATE UNIQUE INDEX "vacation_weeks_startDate_key" ON "vacation_weeks"("startDate");
