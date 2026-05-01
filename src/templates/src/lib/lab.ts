// src/lib/lab.ts
import { getCollection } from 'astro:content';

export interface LabItem {
  slug: string;
  id: string; // Astro 6 中每个条目都有唯一 ID
  title: string;
  shortDesc: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category: string;
  keywords: string[];
  links: Array<{ name: string; url: string }>;
  body: string;
  render: any; // 用于渲染 MDX
}

export async function getAllLabs(): Promise<LabItem[]> {
  // 获取所有非草稿的实验
  const entries = await getCollection('lab', ({ data }) => !data.draft);
  
  return entries.map((entry) => ({
    id: entry.id,
    slug: entry.id.replace(/\.mdx?$/, ''), // 从文件名生成 slug
    title: entry.data.title,
    shortDesc: entry.data.shortDesc,
    createdAt: entry.data.createdAt,
    updatedAt: entry.data.updatedAt,
    tags: entry.data.tags || [],
    category: entry.data.category || 'Uncategorized',
    keywords: entry.data.keywords || [],
    links: entry.data.links || [],
    body: entry.body || '', // Markdown 正文
    render: entry.render,
  })).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getLabFilters() {
  const labs = await getAllLabs();
  const categories = Array.from(new Set(labs.map(l => l.category))).sort();
  const tags = Array.from(new Set(labs.flatMap(l => l.tags))).sort();
  return { categories, tags };
}