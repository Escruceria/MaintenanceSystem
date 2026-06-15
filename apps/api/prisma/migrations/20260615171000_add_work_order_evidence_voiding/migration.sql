ALTER TABLE "WorkOrderEvidence"
ADD COLUMN "voidedAt" TIMESTAMP(3),
ADD COLUMN "voidedById" TEXT,
ADD COLUMN "voidReason" TEXT;

CREATE INDEX "WorkOrderEvidence_voidedAt_idx"
ON "WorkOrderEvidence"("voidedAt");

CREATE INDEX "WorkOrderEvidence_voidedById_idx"
ON "WorkOrderEvidence"("voidedById");

ALTER TABLE "WorkOrderEvidence"
ADD CONSTRAINT "WorkOrderEvidence_voidedById_fkey"
FOREIGN KEY ("voidedById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
