CREATE TYPE "WarrantyStatus" AS ENUM (
  'ACTIVE',
  'EXPIRED',
  'CANCELLED'
);

ALTER TABLE "Asset"
ADD COLUMN "supplierId" TEXT;

ALTER TABLE "Supplier"
ADD COLUMN "contactName" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "AssetWarranty" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "supplierId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "policyNumber" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "WarrantyStatus" NOT NULL DEFAULT 'ACTIVE',
  "terms" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AssetWarranty_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Asset_supplierId_idx"
ON "Asset"("supplierId");

CREATE INDEX "Supplier_isActive_idx"
ON "Supplier"("isActive");

CREATE INDEX "Supplier_name_idx"
ON "Supplier"("name");

CREATE INDEX "AssetWarranty_assetId_idx"
ON "AssetWarranty"("assetId");

CREATE INDEX "AssetWarranty_supplierId_idx"
ON "AssetWarranty"("supplierId");

CREATE INDEX "AssetWarranty_status_idx"
ON "AssetWarranty"("status");

CREATE INDEX "AssetWarranty_endDate_idx"
ON "AssetWarranty"("endDate");

ALTER TABLE "Asset"
ADD CONSTRAINT "Asset_supplierId_fkey"
FOREIGN KEY ("supplierId")
REFERENCES "Supplier"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "AssetWarranty"
ADD CONSTRAINT "AssetWarranty_assetId_fkey"
FOREIGN KEY ("assetId")
REFERENCES "Asset"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "AssetWarranty"
ADD CONSTRAINT "AssetWarranty_supplierId_fkey"
FOREIGN KEY ("supplierId")
REFERENCES "Supplier"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
