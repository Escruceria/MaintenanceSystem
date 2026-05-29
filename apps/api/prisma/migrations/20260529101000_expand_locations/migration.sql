-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('SITE', 'BUILDING', 'FLOOR', 'AREA', 'ROOM', 'WAREHOUSE', 'POINT', 'OTHER');

-- AlterTable
ALTER TABLE "Location"
ADD COLUMN "description" TEXT,
ADD COLUMN "type" "LocationType" NOT NULL DEFAULT 'AREA',
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");

-- CreateIndex
CREATE INDEX "Location_type_idx" ON "Location"("type");

-- CreateIndex
CREATE INDEX "Location_isActive_idx" ON "Location"("isActive");
