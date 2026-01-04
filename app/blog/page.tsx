import { PrismaClient } from "@prisma/client";
import BlogPageClient from "./BlogPageClient";

const prisma = new PrismaClient();

export const revalidate = 3600; // Revalidate every hour

async function getPublishedPosts() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      tags: true,
      publishedAt: true,
      readTimeMinutes: true,
      viewCount: true,
    },
  });

  return posts;
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return <BlogPageClient initialPosts={posts as any} />;
}
