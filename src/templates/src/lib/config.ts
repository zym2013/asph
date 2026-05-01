import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
export interface TopBarConfig {
  logo: { text: string; href: string; ariaLabel: string };
  defaultTitle: string;
  buttons: {
    travelling: {
      enabled: boolean;
      icon: string;
      tooltip: string;
      confirmText: string;
      cancelText: string;
      confirmBtnText: string;
      targetUrl: string;
    };
    randomPost: {
      enabled: boolean;
      icon: string;
      tooltip: string;
      fallbackUrl: string;
    };
    rss: {
      enabled: boolean;
      icon: string;
      tooltip: string;
      url: string;
      external: boolean;
    };
    themeToggle: {
      enabled: boolean;
      tooltipLight: string;
      tooltipDark: string;
      iconLight: string;
      iconDark: string;
      ariaLabelLight: string;
      ariaLabelDark: string;
    };
    scrollTop: {
      enabled: boolean;
      tooltip: string;
      showArrowThreshold: number;
      transitionName: string;
    };
  };
  tooltip: {
    transitionName: string;
    transitionMode: string;
    hideDelay: number;
  };
  scroll: {
    scrollTopThreshold: number;
    hasScrollbarThreshold: number;
  };
  blog?: {
    authorName?: string;
    pageBio?: string;
  };
  site?: {
    name?: string;
    shortName?: string;
    description?: string;
    url?: string;
    seo?: {
      keywords?: string[];
      author?: string;
      twitter?: string;
      ogImage?: string;
    };
    services?: {
      analytics?: { enabled?: boolean; provider?: string; id?: string };
      giscus?: {
        repo?: string;
        repoId?: string;
        category?: string;
        categoryId?: string;
        mapping?: string;
        strict?: number;
        reactionsEnabled?: number;
        emitMetadata?: number;
        theme?: string;
        lang?: string;
      };
    };
  };
}
export interface HomeConfig {
  home: {
    typedName: string;
    navigation: Array<{ text: string; href: string; external?: boolean }>;
    footer: { copyright: string; year: number; github: string };
  };
  about: {
    avatar: { src: string; alt: string };
    name: { main: string; sub: string };
    oneLiner: { enabled: boolean; text: string; typeSpeed: number; showCursor: boolean };
    quote: { en: string; cn: string };
    socialLinks: Array<{ name: string; url: string; icon: string; external?: boolean }>;
  };
  reserved: { title: string; description: string };
  pageSwitcher: { totalPages: number; scrollThreshold: number; scrollCooldown: number };
  footer?: {
    enabled?: boolean;
    socialLinks?: Array<{ name: string; url: string; icon: string }>;
    linkColumns?: Array<{
      title: string;
      links: Array<{ text: string; url: string; external?: boolean }>;
    }>;
    bottom?: {
      copyright?: { author: string; startYear: number };
      theme?: { text: string; url: string; icon: string };
      license?: { name: string; url: string; icons: string[] };
    };
    poem?: {
      enabled?: boolean;
      source?: 'jinrishici' | 'custom';
      customText?: string;
      typeSpeed?: number;
      backSpeed?: number;
      backDelay?: number;
      loop?: boolean;
    };
  };
}
export interface SiteConfig extends HomeConfig {
  topbar: TopBarConfig;
}
function loadYamlFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ 配置文件不存在: ${filePath}`);
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = yaml.load(content);
    return (parsed as T) || fallback;
  } catch (error) {
    console.error(`❌ 解析配置文件失败: ${filePath}`, error);
    return fallback;
  }
}
function extractTopbarConfig(raw: any): TopBarConfig {
  if (!raw) return {} as TopBarConfig;
  const config = raw.topbar || raw;
  return config as TopBarConfig;
}
export const config: SiteConfig = (() => {
  const cwd = process.cwd();
  const homePath = path.resolve(cwd, 'src/config/home.yaml');
  const homeConfig = loadYamlFile<HomeConfig>(homePath, {} as HomeConfig);
  const topbarPath = path.resolve(cwd, 'src/config/topbar.yaml');
  const topbarRaw = loadYamlFile<{ topbar?: TopBarConfig }>(topbarPath, {});
  const topbarConfig = extractTopbarConfig(topbarRaw);
  if (process.env.NODE_ENV === 'development' || import.meta?.env?.DEV) {
    console.log('✅ Config loaded:', {
      home: {
        typedName: homeConfig.home?.typedName,
        navCount: homeConfig.home?.navigation?.length
      },
      topbar: {
        logoText: topbarConfig.logo?.text,
        buttonsCount: Object.keys(topbarConfig.buttons || {}).length
      }
    });
  }
  return {
    ...homeConfig,
    topbar: topbarConfig
  } as SiteConfig;
})();
export const globalConfig = JSON.parse(JSON.stringify(config)) as SiteConfig;
export const topbarConfig = globalConfig.topbar;
export const homeConfig = globalConfig;