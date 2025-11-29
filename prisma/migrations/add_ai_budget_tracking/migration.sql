-- CreateTable
CREATE TABLE "AIInsightUsage" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dailyCount" INTEGER NOT NULL DEFAULT 0,
    "monthlyCount" INTEGER NOT NULL DEFAULT 0,
    "month" TEXT NOT NULL,
    "lastReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIInsightUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIInsightUsage_date_key" ON "AIInsightUsage"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AIInsightUsage_month_key" ON "AIInsightUsage"("month");
