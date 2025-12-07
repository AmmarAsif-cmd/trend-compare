import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug: resolvedParams.slug, status: "published" },
  });

  if (!post) return {};

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords.join(", "),
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
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link href="/blog" className="text-blue-600 hover:text-blue-900">
            ← Back to Blog
          </Link>
        </nav>

        {/* Category */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

        {/* Excerpt */}
        <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>

        {/* Meta */}
        <div className="flex items-center gap-6 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
          <span>
            {new Date(post.publishedAt!).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>{post.readTimeMinutes} min read</span>
          <span>{post.viewCount} views</span>
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
    </div>
  );
}
