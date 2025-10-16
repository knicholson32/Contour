-- CreateTable
CREATE TABLE "exports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataSourceVersion" INTEGER NOT NULL,
    "params" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "generated_utc" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "exports_dataSourceVersion_params_key" ON "exports"("dataSourceVersion", "params");
