// src/lib/blog.ts
import matter from 'gray-matter';

export interface PostMeta {
  title: string;
  description: string;
  pubDate: string;
  tags: string[];
  draft?: boolean;
  wordCount: number;
  
  // 👇 新增字段
  icon?: string;           // Font Awesome 类名，如 'fa-solid fa-paw'
  iconColor?: string;      // 图标颜色，如 '#ff6b6b' 或 'var(--accent)'
  category?: string;       // 分类名，如 '日常随笔'
}

export interface Post extends PostMeta {
  slug: string;
  body: string; // 原始 Markdown 内容
  headings: Array<{ text: string; slug: string; depth: number }>;
}

/**
 * 从原始 Markdown 字符串中提取 H2-H4 标题
 */
function extractHeadings(markdown: string): Array<{ text: string; slug: string; depth: number }> {
  const headings: Array<{ text: string; slug: string; depth: number }> = [];
  
  // 正则：匹配行首的 ## 到 ####，后面必须跟至少一个空格
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const depth = match[1].length; // # 的数量即深度 (2, 3, 4)
    let rawText = match[2].trim();
    
    // 清理文本中的 Markdown 语法，只保留纯文本用于目录显示
    // 1. 移除链接 [text](url) -> text
    rawText = rawText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // 2. 移除粗体/斜体 **text** 或 *text* -> text
    rawText = rawText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
    // 3. 移除行内代码 `code` -> code
    rawText = rawText.replace(/`(.*?)`/g, '$1');
    
    // 生成 Slug (与 remark-rehype 默认行为保持一致)
    const slug = rawText
      .toLowerCase()
      .replace(/[\s]+/g, '-')   // 空格变横杠
      .replace(/[^\w\-]/g, ''); // 移除非单词字符和非横杠字符

    headings.push({
      text: rawText,
      slug: slug,
      depth: depth
    });
  }
  
  return headings;
}

export async function getAllPosts(): Promise<Post[]> {
  const globPosts = import.meta.glob('./posts/*.md', { query: '?raw', import: 'default' });
  const posts: Post[] = [];

  for (const path in globPosts) {
    try {
      const rawContent = await globPosts[path]() as string;
      const { data, content: body } = matter(rawContent);
      
      if (data.draft && import.meta.env.PROD) continue;

      const slug = path.split('/').pop()?.replace('.md', '') || '';
      const pubDate = data.pubDate ? new Date(data.pubDate).toISOString() : new Date().toISOString();

      posts.push({
        slug,
        title: data.title || '无标题',
        description: data.description || '',
        pubDate: pubDate,
        tags: Array.isArray(data.tags) ? data.tags : [],
        icon: data.icon || 'fa-solid fa-feather-pointed',
        iconColor: data.iconColor || 'var(--vp-c-text-3)',
        category: data.category || '未分类',
        wordCount: data.wordCount || body?.split(/\s+/).length || 0,
        body: body,
        headings: extractHeadings(body),
      });
    } catch (e) {
      console.error(`Error loading post list ${path}:`, e);
    }
  }

  return posts.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const path = `./posts/${slug}.md`;
  // 使用新的 Vite glob 语法
  const globPosts = import.meta.glob('./posts/*.md', { query: '?raw', import: 'default' });
  const loader = globPosts[path];
  
  try {
    if (!loader) return null;

    const rawContent = await loader() as string;
    const { data, content: body } = matter(rawContent);

    const pubDate = data.pubDate ? new Date(data.pubDate).toISOString() : new Date().toISOString();

    return {
      slug,
      title: data.title || '无标题',
      description: data.description || '',
      pubDate: pubDate,
      tags: Array.isArray(data.tags) ? data.tags : [],
      icon: data.icon || 'fa-solid fa-feather-pointed',
      iconColor: data.iconColor || 'var(--vp-c-text-3)',
      category: data.category || '未分类',
      wordCount: data.wordCount || body?.split(/\s+/).length || 0,
      body: body,
      headings: extractHeadings(body) // <--- 关键：提取 Heading
    };
  } catch (e) {
    console.error(`Error loading post ${slug}:`, e);
    return null;
  }
}