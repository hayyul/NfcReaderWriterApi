-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "PumpStatus" AS ENUM ('LOCKED', 'OPEN', 'BROKEN');

-- CreateEnum
CREATE TYPE "VerificationResult" AS ENUM ('SUCCESS', 'FAILED', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_stations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "status" "StationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gas_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pumps" (
    "id" SERIAL NOT NULL,
    "stationId" INTEGER NOT NULL,
    "pumpNumber" INTEGER NOT NULL,
    "mainRfidTag" VARCHAR(100) NOT NULL,
    "status" "PumpStatus" NOT NULL DEFAULT 'LOCKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pumps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expected_child_tags" (
    "id" SERIAL NOT NULL,
    "pumpId" INTEGER NOT NULL,
    "tagId" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expected_child_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_sessions" (
    "id" SERIAL NOT NULL,
    "pumpId" INTEGER NOT NULL,
    "userId" INTEGER,
    "mainTagScanned" VARCHAR(100) NOT NULL,
    "verificationResult" "VerificationResult" NOT NULL,
    "missingTagsCount" INTEGER NOT NULL DEFAULT 0,
    "unexpectedTagsCount" INTEGER NOT NULL DEFAULT 0,
    "totalScanned" INTEGER NOT NULL DEFAULT 0,
    "resultMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scanned_child_tags" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "tagId" VARCHAR(100) NOT NULL,
    "scanOrder" INTEGER NOT NULL,
    "isExpected" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scanned_child_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "gas_stations_status_idx" ON "gas_stations"("status");

-- CreateIndex
CREATE INDEX "gas_stations_name_idx" ON "gas_stations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pumps_mainRfidTag_key" ON "pumps"("mainRfidTag");

-- CreateIndex
CREATE INDEX "pumps_stationId_idx" ON "pumps"("stationId");

-- CreateIndex
CREATE INDEX "pumps_mainRfidTag_idx" ON "pumps"("mainRfidTag");

-- CreateIndex
CREATE INDEX "pumps_status_idx" ON "pumps"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pumps_stationId_pumpNumber_key" ON "pumps"("stationId", "pumpNumber");

-- CreateIndex
CREATE INDEX "expected_child_tags_pumpId_idx" ON "expected_child_tags"("pumpId");

-- CreateIndex
CREATE INDEX "expected_child_tags_tagId_idx" ON "expected_child_tags"("tagId");

-- CreateIndex
CREATE INDEX "expected_child_tags_isActive_idx" ON "expected_child_tags"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "expected_child_tags_pumpId_tagId_key" ON "expected_child_tags"("pumpId", "tagId");

-- CreateIndex
CREATE INDEX "verification_sessions_pumpId_idx" ON "verification_sessions"("pumpId");

-- CreateIndex
CREATE INDEX "verification_sessions_userId_idx" ON "verification_sessions"("userId");

-- CreateIndex
CREATE INDEX "verification_sessions_verificationResult_idx" ON "verification_sessions"("verificationResult");

-- CreateIndex
CREATE INDEX "verification_sessions_timestamp_idx" ON "verification_sessions"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "scanned_child_tags_sessionId_idx" ON "scanned_child_tags"("sessionId");

-- CreateIndex
CREATE INDEX "scanned_child_tags_tagId_idx" ON "scanned_child_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_key" ON "auth_tokens"("token");

-- CreateIndex
CREATE INDEX "auth_tokens_userId_idx" ON "auth_tokens"("userId");

-- CreateIndex
CREATE INDEX "auth_tokens_token_idx" ON "auth_tokens"("token");

-- CreateIndex
CREATE INDEX "auth_tokens_expiresAt_idx" ON "auth_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "pumps" ADD CONSTRAINT "pumps_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "gas_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expected_child_tags" ADD CONSTRAINT "expected_child_tags_pumpId_fkey" FOREIGN KEY ("pumpId") REFERENCES "pumps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_pumpId_fkey" FOREIGN KEY ("pumpId") REFERENCES "pumps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scanned_child_tags" ADD CONSTRAINT "scanned_child_tags_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "verification_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
