// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPosts() {
  try {
    const total = await prisma.blogPost.count();
    const pending = await prisma.blogPost.count({ where: { status: 'pending_review' } });
    const published = await prisma.blogPost.count({ where: { status: 'published' } });
    const approved = await prisma.blogPost.count({ where: { status: 'approved' } });
    
    console.log('\n📊 Blog Posts Status:');
    console.log(`   Total: ${total}`);
    console.log(`   📝 Pending Review: ${pending}`);
    console.log(`   ✅ Approved: ${approved}`);
    console.log(`   🚀 Published: ${published}`);
    
    if (pending > 0) {
      const pendingPosts = await prisma.blogPost.findMany({
        where: { status: 'pending_review' },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, createdAt: true }
      });
      
      console.log('\n📋 Recent Pending Posts:');
      pendingPosts.forEach((p, i) => {
        const date = new Date(p.createdAt).toLocaleDateString();
        console.log(`   ${i + 1}. ${p.title.substring(0, 60)}... (${date})`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

checkPosts();

