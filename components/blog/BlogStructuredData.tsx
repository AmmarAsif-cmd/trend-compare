/**
 * Structured Data for Blog Posts
 * 
 * Generates JSON-LD schema for:
 * - Article (BlogPosting)
 * - BreadcrumbList
 */

interface BlogStructuredDataProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    publishedAt: Date | null;
    updatedAt: Date;
    keywords: string[];
    author?: string;
  };
}

export default function BlogStructuredData({ post }: BlogStructuredDataProps) {
  const baseUrl = 'https://trendarc.net';
  const blogUrl = `${baseUrl}/blog/${post.slug}`;
  const publishedDate = post.publishedAt?.toISOString() || post.updatedAt.toISOString();
  const modifiedDate = post.updatedAt.toISOString();

  // Article Schema (BlogPosting)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: `${baseUrl}/og-image.png`, // Default OG image, can be customized per post
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Organization',
      name: 'TrendArc',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TrendArc',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': blogUrl,
    },
    articleSection: post.category,
    keywords: post.keywords.join(', '),
    wordCount: post.content.split(/\s+/).length,
    inLanguage: 'en-US',
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${baseUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: blogUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

