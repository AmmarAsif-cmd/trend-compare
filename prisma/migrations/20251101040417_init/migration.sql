-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "geo" TEXT NOT NULL,
    "terms" JSONB NOT NULL,
    "series" JSONB NOT NULL,
    "stats" JSONB NOT NULL,
    "ai" JSONB,
    "dataHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comparison_slug_idx" ON "Comparison"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Comparison_slug_timeframe_geo_key" ON "Comparison"("slug", "timeframe", "geo");
