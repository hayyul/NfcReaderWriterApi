-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('STATION', 'PUMP', 'USER', 'VERIFICATION', 'EXPECTED_TAG');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "gas_stations" ADD COLUMN     "lastModifiedBy" INTEGER,
ADD COLUMN     "lastVerificationAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pumps" ADD COLUMN     "lastModifiedBy" INTEGER,
ADD COLUMN     "lastVerificationAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "gas_stations_lastModifiedBy_idx" ON "gas_stations"("lastModifiedBy");

-- CreateIndex
CREATE INDEX "gas_stations_lastVerificationAt_idx" ON "gas_stations"("lastVerificationAt");

-- CreateIndex
CREATE INDEX "pumps_lastModifiedBy_idx" ON "pumps"("lastModifiedBy");

-- CreateIndex
CREATE INDEX "pumps_lastVerificationAt_idx" ON "pumps"("lastVerificationAt");

-- AddForeignKey
ALTER TABLE "gas_stations" ADD CONSTRAINT "gas_stations_lastModifiedBy_fkey" FOREIGN KEY ("lastModifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pumps" ADD CONSTRAINT "pumps_lastModifiedBy_fkey" FOREIGN KEY ("lastModifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
