// components/DynamicHeroChartServer.tsx
import { getDailyComparisonSlug } from "@/lib/dailyComparisonRotator";
import DynamicHeroChartClient from "./DynamicHeroChartClient";

export default async function DynamicHeroChartServer() {
  const comparison = await getDailyComparisonSlug();
  
  return <DynamicHeroChartClient comparison={comparison} />;
}


