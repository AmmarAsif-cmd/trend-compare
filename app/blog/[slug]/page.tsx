import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import AdSense from "@/components/AdSense";
import type { Metadata } from "next";
import { getBlogCanonicalUrl } from "@/lib/canonical-url";
import BlogStructuredData from "@/components/blog/BlogStructuredData";

const prisma = new PrismaClient();

export const revalidate = 3600; // Revalidate every hour

async function getPost(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "published" },
  });

  if (!post) return null;

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  return post;
}

async function getRelatedPosts(category: string, currentSlug: string) {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: "published",
      category,
      slug: { not: currentSlug },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      readTimeMinutes: true,
    },
  });

  return posts;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug: resolvedParams.slug, status: "published" },
  });

  if (!post) return {};

  const canonicalUrl = getBlogCanonicalUrl(resolvedParams.slug);

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords.join(", "),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      url: canonicalUrl,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: ["TrendArc"],
      tags: post.keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.category, post.slug);

  return (
    <div className="min-h-screen bg-white">
      {/* Article Header */}
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4 sm:mb-8 flex items-center gap-4">
          <Link href="/blog" className="text-sm sm:text-base text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors">
            <span>←</span> <span>Back to Blog</span>
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/" className="text-sm sm:text-base text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
            <span>Home</span>
          </Link>
        </nav>

        {/* Category */}
        <div className="mb-3 sm:mb-4">
          <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">{post.title}</h1>

        {/* Excerpt */}
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-4 sm:mb-6 leading-relaxed">{post.excerpt}</p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-200">
          <span>
            {new Date(post.publishedAt!).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>{post.readTimeMinutes} min read</span>
          {post.viewCount > 0 && <span>{post.viewCount} views</span>}
        </div>

        {/* AdSense - Top of Content */}
        <div className="mb-8 flex justify-center">
          <AdSense
            adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_1}
            adFormat="auto"
            fullWidthResponsive
            className="min-h-[100px]"
          />
        </div>

        {/* Content */}
        <div className="prose prose-lg prose-blue max-w-none">
          <ReactMarkdown
            components={{
              h2: ({ children, ...props }) => (
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4" {...props}>
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3" {...props}>
                  {children}
                </h3>
              ),
              p: ({ children, ...props }) => (
                <p className="text-gray-700 mb-4 leading-relaxed" {...props}>
                  {children}
                </p>
              ),
              ul: ({ children, ...props }) => (
                <ul className="list-disc pl-6 mb-4 space-y-2" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="list-decimal pl-6 mb-4 space-y-2" {...props}>
                  {children}
                </ol>
              ),
              strong: ({ children, ...props }) => (
                <strong className="font-bold text-gray-900" {...props}>
                  {children}
                </strong>
              ),
              a: ({ children, href, ...props }) => (
                <a
                  href={href}
                  className="text-blue-600 hover:text-blue-900 underline"
                  {...props}
                >
                  {children}
                </a>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* References Section */}
        {post.references && Array.isArray(post.references) && (post.references as any[]).length > 0 && (
          <div className="mt-12 pt-8 border-t-2 border-gray-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">References</h2>
            <div className="space-y-4">
              {(post.references as any[]).map((ref: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 font-bold text-blue-600">[{index + 1}]</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">{ref.title}</div>
                      <div className="text-sm text-gray-600 mb-2">{ref.source}</div>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-900 underline break-all"
                      >
                        {ref.url}
                      </a>
                      <div className="text-xs text-gray-500 mt-1">
                        Accessed: {new Date(ref.accessDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AdSense - Bottom of Content */}
        <div className="mt-12 mb-8 flex justify-center">
          <AdSense
            adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_2}
            adFormat="auto"
            fullWidthResponsive
            className="min-h-[100px]"
          />
        </div>

        {/* Related Comparison */}
        {post.comparisonSlug && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              View the Live Comparison
            </h3>
            <p className="text-gray-600 mb-4">
              See real-time trend data and interactive charts for this comparison.
            </p>
            <Link
              href={`/compare/${post.comparisonSlug}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Comparison →
            </Link>
          </div>
        )}
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost: any) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600">
                    {relatedPost.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                  <span className="text-sm text-gray-500">
                    {relatedPost.readTimeMinutes} min read
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Structured Data */}
      <BlogStructuredData
        post={{
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          keywords: post.keywords,
        }}
      />
    </div>
  );
}
