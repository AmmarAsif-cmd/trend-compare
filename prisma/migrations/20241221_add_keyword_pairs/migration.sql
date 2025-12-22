-- CreateTable
CREATE TABLE "KeywordPair" (
    "id" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "searchVolume" TEXT DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'manual',
    "importedFrom" TEXT,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordPair_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_pair" ON "KeywordPair"("termA", "termB");

-- CreateIndex
CREATE INDEX "KeywordPair_category_idx" ON "KeywordPair"("category");

-- CreateIndex
CREATE INDEX "KeywordPair_status_idx" ON "KeywordPair"("status");

-- CreateIndex
CREATE INDEX "KeywordPair_qualityScore_idx" ON "KeywordPair"("qualityScore");

-- CreateIndex
CREATE INDEX "KeywordPair_source_idx" ON "KeywordPair"("source");
