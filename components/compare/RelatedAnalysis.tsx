/**
 * Related Analysis Section for Comparison Pages
 * 
 * Displays relevant blog posts that provide context and interpretation
 * for the current comparison. Server-rendered for SEO.
 */

import Link from 'next/link';
import { getRelatedBlogsForComparison } from '@/lib/blog/related-blogs';

interface RelatedAnalysisProps {
  comparisonSlug: string;
  comparisonTerms: string[];
  comparisonCategory: string | null;
}

export default async function RelatedAnalysis({
  comparisonSlug,
  comparisonTerms,
  comparisonCategory,
}: RelatedAnalysisProps) {
  const relatedBlogs = await getRelatedBlogsForComparison({
    comparisonSlug,
    comparisonTerms,
    comparisonCategory,
    limit: 3,
  });

  if (relatedBlogs.length === 0) {
    return null; // Don't show section if no related blogs
  }

  return (
    <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50/50 to-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden p-5 sm:p-6 lg:p-8 mb-6 sm:mb-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Related Analysis
        </h2>
        <p className="text-slate-600 text-base sm:text-lg">
          Deep insights and interpretation of trends related to this comparison
        </p>
      </div>

      {/* Blog List */}
      <div className="space-y-4">
        {relatedBlogs.map((blog) => (
          <Link
            key={blog.slug}
            href={`/blog/${blog.slug}`}
            className="group block bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Category */}
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {blog.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {blog.title}
                </h3>

                {/* Excerpt */}
                <p className="text-slate-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                  {blog.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>
                    {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>{blog.readTimeMinutes} min read</span>
                </div>
              </div>

              {/* Arrow Icon */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          View All Articles
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}

