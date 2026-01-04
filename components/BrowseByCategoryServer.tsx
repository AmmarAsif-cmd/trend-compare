// components/BrowseByCategoryServer.tsx
import { CATEGORY_DATA, getHybridComparisons } from "@/lib/categoryComparisons";
import BrowseByCategory from "./BrowseByCategory";
import { unstable_cache } from "next/cache";

// Cache the hybrid data with time-based key that changes every 4 hours
// This ensures comparisons rotate regularly
const getCachedHybridData = unstable_cache(
  async () => {
    const hybridData: Record<string, Array<{ slug: string; title: string; trending?: boolean }>> = {};

    // Fetch hybrid comparisons for each category (10 per category for better variety)
    for (const category of CATEGORY_DATA) {
      const comparisons = await getHybridComparisons(category.id, 10);
      hybridData[category.id] = comparisons;
    }

    return hybridData;
  },
  ['browse-by-category-time'],
  {
    revalidate: 14400, // Revalidate every 4 hours (matches time-based seed rotation)
    tags: ['category-comparisons']
  }
);

export default async function BrowseByCategoryServer() {
  const hybridData = await getCachedHybridData();

  return <BrowseByCategory categories={CATEGORY_DATA} hybridData={hybridData} />;
}
