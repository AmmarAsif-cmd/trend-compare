/**
 * Featured Blogs Section for Homepage
 * 
 * Displays curated blog posts that provide insights and analysis.
 * Server-rendered for SEO.
 */

import Link from 'next/link';
import { getFeaturedBlogs } from '@/lib/blog/related-blogs';
import { BLOG_CATEGORIES } from '@/lib/blog/categories';

export default async function FeaturedBlogs() {
  const featuredBlogs = await getFeaturedBlogs(5);

  if (featuredBlogs.length === 0) {
    return null; // Don't show section if no blogs
  }

  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Insights & Analysis
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Deep dives into trends, market behavior, and how to interpret comparison data
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredBlogs.map((blog) => (
            <Link
              key={blog.slug}
              href={`/blog/${blog.slug}`}
              className="group bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
            >
              {/* Category Badge */}
              <div className="mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {blog.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                {blog.title}
              </h3>

              {/* Excerpt */}
              <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                {blog.excerpt}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>{blog.readTimeMinutes} min read</span>
              </div>

              {/* Hover Arrow */}
              <div className="mt-4 flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">Read more</span>
                <svg
                  className="w-4 h-4 ml-2"
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
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View All Articles
            <svg
              className="w-5 h-5 ml-2"
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
      </div>
    </section>
  );
}

