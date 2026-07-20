-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "hrHourlyRate" REAL,
    "costOfVacancyPerDay" REAL,
    "platformCostPerYear" REAL,
    "catalystObjectId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountModule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "fileName" TEXT,
    "importedById" TEXT NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL,
    CONSTRAINT "ImportBatch_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL,
    "metrics" JSONB NOT NULL,
    "importBatchId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetricSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MetricSnapshot_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoiStatement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "statementPeriodLabel" TEXT,
    "baselineSnapshotIds" JSONB NOT NULL,
    "currentSnapshotIds" JSONB NOT NULL,
    "resolvedInputs" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "personaTags" JSONB,
    "narrative" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoiStatement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoiStatement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_catalystObjectId_key" ON "Account"("catalystObjectId");

-- CreateIndex
CREATE INDEX "Account_ownerId_idx" ON "Account"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountModule_accountId_moduleKey_key" ON "AccountModule"("accountId", "moduleKey");

-- CreateIndex
CREATE INDEX "MetricSnapshot_accountId_moduleKey_capturedAt_idx" ON "MetricSnapshot"("accountId", "moduleKey", "capturedAt");

-- CreateIndex
CREATE INDEX "RoiStatement_accountId_createdAt_idx" ON "RoiStatement"("accountId", "createdAt");
