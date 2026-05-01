// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getAllPosts } from '../lib/blog';

export const GET = async (context) => {
  const posts = await getAllPosts();
  
  // 过滤草稿并发布过的文章
  const publishedPosts = posts.filter(post => !post.draft);
  
  return rss({
    title: 'zym2013 的博客',
    description: 'zym2013 的个人博客，记录技术、生活与思考',
    site: context.site || 'https://zym2013.github.io',
    items: publishedPosts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.pubDate),
      description: post.description,
      link: `/blog/${post.slug}/`,
      // 可选：添加完整内容（如果希望 RSS 包含全文）
      // content: post.content, 
    })),
    customData: `<language>zh-CN</language>`,
    trailingSlash: true,
  });
};