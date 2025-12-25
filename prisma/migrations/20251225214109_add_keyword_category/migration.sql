-- CreateTable
CREATE TABLE IF NOT EXISTS "KeywordCategory" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "KeywordCategory_keyword_key" ON "KeywordCategory"("keyword");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KeywordCategory_category_idx" ON "KeywordCategory"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KeywordCategory_source_idx" ON "KeywordCategory"("source");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KeywordCategory_updatedAt_idx" ON "KeywordCategory"("updatedAt");
