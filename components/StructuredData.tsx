/**
 * Structured Data Component (Schema.org JSON-LD)
 * Helps Google understand content and display rich snippets
 */

type StructuredDataProps = {
  termA: string;
  termB: string;
  slug: string;
  series: Array<{ date: string; [key: string]: any }>;
  leader: string;
  advantage: number;
};

export default function StructuredData({
  termA,
  termB,
  slug,
  series,
  leader,
  advantage,
}: StructuredDataProps) {
  if (!series || series.length === 0) return null;

  const prettyTerm = (t: string) =>
    t
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const firstDate = series[0].date;
  const lastDate = series[series.length - 1].date;
  const lastUpdated = new Date(lastDate).toISOString();
  const firstPublished = new Date(firstDate).toISOString();

  // Calculate average values
  const avgA =
    series.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / series.length;
  const avgB =
    series.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) / series.length;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `https://trendarc.net/compare/${slug}#article`,
        headline: `${prettyTerm(termA)} vs ${prettyTerm(termB)} Trend Comparison`,
        description: `Live comparison of ${prettyTerm(termA)} and ${prettyTerm(
          termB
        )} search trends with AI-powered insights. ${prettyTerm(
          leader
        )} currently leading by ${advantage}%.`,
        datePublished: firstPublished,
        dateModified: lastUpdated,
        author: {
          "@type": "Organization",
          name: "TrendArc",
          url: "https://trendarc.net",
        },
        publisher: {
          "@type": "Organization",
          name: "TrendArc",
          url: "https://trendarc.net",
          logo: {
            "@type": "ImageObject",
            url: "https://trendarc.com/logo.png",
            width: 600,
            height: 60,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://trendarc.com/compare/${slug}`,
        },
        about: [
          {
            "@type": "Thing",
            name: prettyTerm(termA),
          },
          {
            "@type": "Thing",
            name: prettyTerm(termB),
          },
        ],
      },
      {
        "@type": "DataVisualization",
        "@id": `https://trendarc.com/compare/${slug}#visualization`,
        name: `${prettyTerm(termA)} vs ${prettyTerm(termB)} Trend Chart`,
        description: `Interactive visualization comparing ${prettyTerm(
          termA
        )} and ${prettyTerm(termB)} search interest over time. Shows ${prettyTerm(
          leader
        )} leading by ${advantage}%.`,
        measurementTechnique:
          "Multi-source trend aggregation including Google Trends, YouTube, TMDB, Spotify, Steam, and Best Buy data",
        variableMeasured: [
          {
            "@type": "PropertyValue",
            name: prettyTerm(termA),
            value: Math.round(avgA),
            unitText: "relative interest (0-100 scale)",
            description: `Average search interest for ${prettyTerm(termA)}`,
          },
          {
            "@type": "PropertyValue",
            name: prettyTerm(termB),
            value: Math.round(avgB),
            unitText: "relative interest (0-100 scale)",
            description: `Average search interest for ${prettyTerm(termB)}`,
          },
        ],
        datePublished: firstPublished,
        dateModified: lastUpdated,
      },
      {
        "@type": "WebPage",
        "@id": `https://trendarc.com/compare/${slug}`,
        url: `https://trendarc.com/compare/${slug}`,
        name: `${prettyTerm(termA)} vs ${prettyTerm(termB)} - Live Trend Comparison`,
        description: `Compare ${prettyTerm(termA)} and ${prettyTerm(
          termB
        )} search trends with real-time data, AI insights, and historical analysis.`,
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://trendarc.net",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Compare",
              item: "https://trendarc.com/compare",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: `${prettyTerm(termA)} vs ${prettyTerm(termB)}`,
              item: `https://trendarc.com/compare/${slug}`,
            },
          ],
        },
        mainEntity: {
          "@id": `https://trendarc.com/compare/${slug}#visualization`,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `https://trendarc.com/compare/${slug}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: `Which is more popular: ${prettyTerm(termA)} or ${prettyTerm(termB)}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Currently, ${prettyTerm(
                leader
              )} is more popular in search interest, leading by ${advantage}% based on multi-source trend data.`,
            },
          },
          {
            "@type": "Question",
            name: `How is this comparison data calculated?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `This comparison aggregates data from multiple sources including Google Trends search data, YouTube engagement, and category-specific sources (TMDB for movies, Spotify for music, Steam for games, Best Buy for products) to provide a comprehensive view of trending interest between ${prettyTerm(
                termA
              )} and ${prettyTerm(termB)}.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
}
