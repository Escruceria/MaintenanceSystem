-- Expand maintenance plans from a placeholder table into an operational preventive planning model.
ALTER TABLE "MaintenancePlan"
ADD COLUMN "code" TEXT,
ADD COLUMN "intervalDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "estimatedDurationMinutes" INTEGER,
ADD COLUMN "priority" "WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "nextDueAt" TIMESTAMP(3),
ADD COLUMN "lastGeneratedAt" TIMESTAMP(3);

UPDATE "MaintenancePlan"
SET "code" = 'MP-' || SUBSTRING("id" FROM 1 FOR 8)
WHERE "code" IS NULL;

ALTER TABLE "MaintenancePlan"
ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "MaintenancePlan_code_key" ON "MaintenancePlan"("code");
CREATE INDEX "MaintenancePlan_isActive_idx" ON "MaintenancePlan"("isActive");
CREATE INDEX "MaintenancePlan_type_idx" ON "MaintenancePlan"("type");
CREATE INDEX "MaintenancePlan_nextDueAt_idx" ON "MaintenancePlan"("nextDueAt");

CREATE TABLE "MaintenancePlanTask" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MaintenancePlanTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MaintenancePlanTask_planId_idx" ON "MaintenancePlanTask"("planId");

ALTER TABLE "MaintenancePlanTask"
ADD CONSTRAINT "MaintenancePlanTask_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "MaintenancePlan"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MaintenancePlanAsset" (
  "planId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MaintenancePlanAsset_pkey" PRIMARY KEY ("planId", "assetId")
);

CREATE INDEX "MaintenancePlanAsset_assetId_idx" ON "MaintenancePlanAsset"("assetId");

ALTER TABLE "MaintenancePlanAsset"
ADD CONSTRAINT "MaintenancePlanAsset_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "MaintenancePlan"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaintenancePlanAsset"
ADD CONSTRAINT "MaintenancePlanAsset_assetId_fkey"
FOREIGN KEY ("assetId") REFERENCES "Asset"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkOrder"
ADD COLUMN "maintenancePlanId" TEXT;

ALTER TABLE "WorkOrder"
ADD CONSTRAINT "WorkOrder_maintenancePlanId_fkey"
FOREIGN KEY ("maintenancePlanId") REFERENCES "MaintenancePlan"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
