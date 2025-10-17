-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bn_name" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bn_name" TEXT NOT NULL,
    "lat" TEXT,
    "lon" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upazilas" (
    "id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bn_name" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upazilas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "divisions_name_key" ON "divisions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_bn_name_key" ON "divisions"("bn_name");

-- CreateIndex
CREATE INDEX "divisions_name_idx" ON "divisions"("name");

-- CreateIndex
CREATE INDEX "divisions_bn_name_idx" ON "divisions"("bn_name");

-- CreateIndex
CREATE INDEX "districts_name_idx" ON "districts"("name");

-- CreateIndex
CREATE INDEX "districts_bn_name_idx" ON "districts"("bn_name");

-- CreateIndex
CREATE INDEX "districts_division_id_idx" ON "districts"("division_id");

-- CreateIndex
CREATE UNIQUE INDEX "districts_division_id_name_key" ON "districts"("division_id", "name");

-- CreateIndex
CREATE INDEX "upazilas_name_idx" ON "upazilas"("name");

-- CreateIndex
CREATE INDEX "upazilas_bn_name_idx" ON "upazilas"("bn_name");

-- CreateIndex
CREATE INDEX "upazilas_district_id_idx" ON "upazilas"("district_id");

-- CreateIndex
CREATE UNIQUE INDEX "upazilas_district_id_name_key" ON "upazilas"("district_id", "name");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upazilas" ADD CONSTRAINT "upazilas_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
