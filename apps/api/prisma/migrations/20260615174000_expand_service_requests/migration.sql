CREATE TYPE "ServiceRequestStatus" AS ENUM (
  'OPEN',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'CONVERTED',
  'CLOSED'
);

ALTER TABLE "ServiceRequest"
ADD COLUMN "priority" "WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "status" "ServiceRequestStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN "workOrderId" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "convertedAt" TIMESTAMP(3),
ADD COLUMN "resolution" TEXT;

CREATE UNIQUE INDEX "ServiceRequest_workOrderId_key"
ON "ServiceRequest"("workOrderId");

CREATE INDEX "ServiceRequest_status_idx"
ON "ServiceRequest"("status");

CREATE INDEX "ServiceRequest_priority_idx"
ON "ServiceRequest"("priority");

CREATE INDEX "ServiceRequest_assetId_idx"
ON "ServiceRequest"("assetId");

CREATE INDEX "ServiceRequest_requesterId_idx"
ON "ServiceRequest"("requesterId");

ALTER TABLE "ServiceRequest"
ADD CONSTRAINT "ServiceRequest_workOrderId_fkey"
FOREIGN KEY ("workOrderId")
REFERENCES "WorkOrder"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
