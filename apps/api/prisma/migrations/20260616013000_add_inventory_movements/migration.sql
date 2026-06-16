CREATE TYPE "InventoryMovementType" AS ENUM (
  'INITIAL',
  'IN',
  'OUT',
  'ADJUSTMENT',
  'WORK_ORDER_CONSUMPTION'
);

CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "sparePartId" TEXT NOT NULL,
  "type" "InventoryMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "previousStock" INTEGER NOT NULL,
  "nextStock" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "reference" TEXT,
  "workOrderId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryMovement_sparePartId_idx"
ON "InventoryMovement"("sparePartId");

CREATE INDEX "InventoryMovement_type_idx"
ON "InventoryMovement"("type");

CREATE INDEX "InventoryMovement_workOrderId_idx"
ON "InventoryMovement"("workOrderId");

CREATE INDEX "InventoryMovement_createdById_idx"
ON "InventoryMovement"("createdById");

CREATE INDEX "InventoryMovement_createdAt_idx"
ON "InventoryMovement"("createdAt");

ALTER TABLE "InventoryMovement"
ADD CONSTRAINT "InventoryMovement_sparePartId_fkey"
FOREIGN KEY ("sparePartId")
REFERENCES "SparePart"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement"
ADD CONSTRAINT "InventoryMovement_workOrderId_fkey"
FOREIGN KEY ("workOrderId")
REFERENCES "WorkOrder"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement"
ADD CONSTRAINT "InventoryMovement_createdById_fkey"
FOREIGN KEY ("createdById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
