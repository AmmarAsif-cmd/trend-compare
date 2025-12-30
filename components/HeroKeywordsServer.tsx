// components/HeroKeywordsServer.tsx
import { getRandomComparisonsAcrossCategories } from "@/lib/randomComparisons";
import { unstable_cache } from "next/cache";
import Link from "next/link";

// Cache with time-based rotation (changes every 6 hours)
const getCachedRandomComparisons = unstable_cache(
  async () => {
    return await getRandomComparisonsAcrossCategories(8);
  },
  ['hero-keywords-time'],
  {
    revalidate: 21600, // Revalidate every 6 hours (matches rotation period)
    tags: ['hero-keywords']
  }
);

// Emoji mapping for categories/keywords
const getEmojiForComparison = (slug: string, title: string): string => {
  const lower = slug.toLowerCase();
  if (lower.includes('chatgpt') || lower.includes('gemini') || lower.includes('ai') || lower.includes('react') || lower.includes('vue') || lower.includes('python') || lower.includes('javascript')) return '🤖';
  if (lower.includes('iphone') || lower.includes('samsung') || lower.includes('phone') || lower.includes('mobile')) return '📱';
  if (lower.includes('spotify') || lower.includes('music') || lower.includes('apple-music') || lower.includes('youtube-music')) return '🎵';
  if (lower.includes('netflix') || lower.includes('disney') || lower.includes('hbo') || lower.includes('movie') || lower.includes('tv')) return '🎬';
  if (lower.includes('fortnite') || lower.includes('minecraft') || lower.includes('game') || lower.includes('steam') || lower.includes('playstation') || lower.includes('xbox')) return '🎮';
  if (lower.includes('tesla') || lower.includes('bmw') || lower.includes('car') || lower.includes('vehicle')) return '🚗';
  if (lower.includes('taylor') || lower.includes('beyonce') || lower.includes('artist') || lower.includes('singer')) return '🎤';
  if (lower.includes('nike') || lower.includes('adidas') || lower.includes('shoe')) return '👟';
  if (lower.includes('amazon') || lower.includes('walmart') || lower.includes('uber') || lower.includes('lyft')) return '🏢';
  return '📊'; // Default emoji
};

export default async function HeroKeywordsServer() {
  const comparisons = await getCachedRandomComparisons();

  if (comparisons.length === 0) {
    // Fallback to static comparisons if database query fails
    return (
      <div className="mt-4 sm:mt-5 text-sm text-slate-600">
        <p className="font-medium mb-3 text-slate-700">Popular comparisons across all categories:</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center max-w-3xl mx-auto">
          <Link
            href="/compare/chatgpt-vs-gemini"
            className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
          >
            🤖 ChatGPT vs Gemini
          </Link>
          <Link
            href="/compare/iphone-vs-samsung"
            className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
          >
            📱 iPhone vs Samsung
          </Link>
          <Link
            href="/compare/spotify-vs-apple-music"
            className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
          >
            🎵 Spotify vs Apple Music
          </Link>
          <Link
            href="/compare/netflix-vs-disney-plus"
            className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
          >
            🎬 Netflix vs Disney+
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 sm:mt-5 text-sm text-slate-600">
      <p className="font-medium mb-3 text-slate-700">Popular comparisons across all categories:</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center max-w-3xl mx-auto">
        {comparisons.map((comp) => {
          const emoji = getEmojiForComparison(comp.slug, comp.title);
          return (
            <Link
              key={comp.slug}
              href={`/compare/${comp.slug}`}
              className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
            >
              {emoji} {comp.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}


