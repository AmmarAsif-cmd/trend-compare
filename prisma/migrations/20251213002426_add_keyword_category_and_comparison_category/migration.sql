-- CreateTable
CREATE TABLE "KeywordCategory" (
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

-- AlterTable
ALTER TABLE "Comparison" ADD COLUMN "category" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "KeywordCategory_keyword_key" ON "KeywordCategory"("keyword");

-- CreateIndex
CREATE INDEX "KeywordCategory_keyword_idx" ON "KeywordCategory"("keyword");

-- CreateIndex
CREATE INDEX "KeywordCategory_category_idx" ON "KeywordCategory"("category");

-- CreateIndex
CREATE INDEX "Comparison_category_idx" ON "Comparison"("category");
