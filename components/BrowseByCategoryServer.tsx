// components/BrowseByCategoryServer.tsx
import { CATEGORY_DATA, getHybridComparisons } from "@/lib/categoryComparisons";
import BrowseByCategory from "./BrowseByCategory";
import { unstable_cache } from "next/cache";

// Cache the hybrid data for 1 hour
const getCachedHybridData = unstable_cache(
  async () => {
    const hybridData: Record<string, Array<{ slug: string; title: string; trending?: boolean }>> = {};

    // Fetch hybrid comparisons for each category
    for (const category of CATEGORY_DATA) {
      const comparisons = await getHybridComparisons(category.id, 4);
      hybridData[category.id] = comparisons;
    }

    return hybridData;
  },
  ['browse-by-category'],
  {
    revalidate: 3600, // Revalidate every hour
    tags: ['category-comparisons']
  }
);

export default async function BrowseByCategoryServer() {
  const hybridData = await getCachedHybridData();

  return <BrowseByCategory categories={CATEGORY_DATA} hybridData={hybridData} />;
}
