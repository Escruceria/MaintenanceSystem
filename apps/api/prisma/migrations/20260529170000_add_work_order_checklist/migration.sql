CREATE TYPE "WorkOrderChecklistItemStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'NOT_COMPLETED',
  'NOT_APPLICABLE'
);

CREATE TABLE "WorkOrderChecklistItem" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "maintenancePlanTaskId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "status" "WorkOrderChecklistItemStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "executedById" TEXT,
  "executedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkOrderChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkOrderChecklistItem_workOrderId_maintenancePlanTaskId_key"
ON "WorkOrderChecklistItem"("workOrderId", "maintenancePlanTaskId");

CREATE INDEX "WorkOrderChecklistItem_workOrderId_idx"
ON "WorkOrderChecklistItem"("workOrderId");

CREATE INDEX "WorkOrderChecklistItem_maintenancePlanTaskId_idx"
ON "WorkOrderChecklistItem"("maintenancePlanTaskId");

CREATE INDEX "WorkOrderChecklistItem_status_idx"
ON "WorkOrderChecklistItem"("status");

CREATE INDEX "WorkOrderChecklistItem_executedById_idx"
ON "WorkOrderChecklistItem"("executedById");

ALTER TABLE "WorkOrderChecklistItem"
ADD CONSTRAINT "WorkOrderChecklistItem_workOrderId_fkey"
FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkOrderChecklistItem"
ADD CONSTRAINT "WorkOrderChecklistItem_maintenancePlanTaskId_fkey"
FOREIGN KEY ("maintenancePlanTaskId") REFERENCES "MaintenancePlanTask"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkOrderChecklistItem"
ADD CONSTRAINT "WorkOrderChecklistItem_executedById_fkey"
FOREIGN KEY ("executedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
