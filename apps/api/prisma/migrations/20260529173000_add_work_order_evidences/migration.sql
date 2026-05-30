CREATE TYPE "WorkOrderEvidenceType" AS ENUM (
  'PHOTO',
  'DOCUMENT',
  'NOTE'
);

ALTER TABLE "WorkOrder"
ADD COLUMN "finalNotes" TEXT,
ADD COLUMN "recommendations" TEXT;

CREATE TABLE "WorkOrderEvidence" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "type" "WorkOrderEvidenceType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "fileUrl" TEXT,
  "fileName" TEXT,
  "mimeType" TEXT,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkOrderEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkOrderEvidence_workOrderId_idx"
ON "WorkOrderEvidence"("workOrderId");

CREATE INDEX "WorkOrderEvidence_type_idx"
ON "WorkOrderEvidence"("type");

CREATE INDEX "WorkOrderEvidence_uploadedById_idx"
ON "WorkOrderEvidence"("uploadedById");

ALTER TABLE "WorkOrderEvidence"
ADD CONSTRAINT "WorkOrderEvidence_workOrderId_fkey"
FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkOrderEvidence"
ADD CONSTRAINT "WorkOrderEvidence_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
