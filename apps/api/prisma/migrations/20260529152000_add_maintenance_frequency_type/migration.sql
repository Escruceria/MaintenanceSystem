CREATE TYPE "MaintenanceFrequency" AS ENUM (
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
  'ON_DATE'
);

ALTER TABLE "MaintenancePlan"
ADD COLUMN "frequencyType" "MaintenanceFrequency";

UPDATE "MaintenancePlan"
SET "frequencyType" = CASE
  WHEN lower("frequency") IN ('diaria', 'diario', 'daily') THEN 'DAILY'::"MaintenanceFrequency"
  WHEN lower("frequency") IN ('semanal', 'weekly') THEN 'WEEKLY'::"MaintenanceFrequency"
  WHEN lower("frequency") IN ('anual', 'annual', 'yearly') THEN 'YEARLY'::"MaintenanceFrequency"
  WHEN lower("frequency") IN ('por fecha', 'fecha unica', 'unica', 'one time', 'on date') THEN 'ON_DATE'::"MaintenanceFrequency"
  ELSE 'MONTHLY'::"MaintenanceFrequency"
END;

ALTER TABLE "MaintenancePlan"
ALTER COLUMN "frequencyType" SET DEFAULT 'MONTHLY',
ALTER COLUMN "frequencyType" SET NOT NULL;

CREATE INDEX "MaintenancePlan_frequencyType_idx" ON "MaintenancePlan"("frequencyType");
