<template>
  <footer v-if="cfg.footer?.enabled" class="site-footer" role="contentinfo">
    <div ref="leftColRef" class="footer-left-column">
      <div class="footer-video">
        <video class="avatar-video" src="/fav.mp4" autoplay loop muted playsinline webkit-playsinline preload="auto"
          referrerpolicy="no-referrer" crossorigin="anonymous" aria-label="Site Avatar" />
      </div>
      <div class="footer-social">
        <a v-for="(link, i) in cfg.footer?.socialLinks" :key="i" :href="link.url" :aria-label="link.name"
          class="social-btn" target="_blank" rel="noopener">
          <i :class="link.icon"></i>
        </a>
      </div>
    </div>
    <div ref="linksContainerRef" class="footer-links">
      <div v-for="(column, colIndex) in cfg.footer?.linkColumns" :key="colIndex" class="link-column">
        <h4>{{ column.title }}</h4>
        <ul>
          <li v-for="(link, linkIndex) in column.links" :key="linkIndex">
            <a :href="link.url" :target="link.external ? '_blank' : undefined"
              :rel="link.external ? 'noopener' : undefined">
              {{ link.text }}
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div class="footer-divider" />
    <div class="footer-bottom">
      <div class="footer-left">
        <span class="copyright" v-if="cfg.footer?.bottom?.copyright">
          Copyright © {{ cfg.footer.bottom.copyright.author }} {{ currentYear }}. All rights reserved.
        </span>
        <span class="typewriter-container" v-if="cfg.footer?.poem?.enabled">
          <span ref="typewriterRef" class="typewriter-text" aria-live="polite">{{ displayedPoem }}</span>
          <span class="typewriter-cursor" :class="{ blink: isTyping }">|</span>
        </span>
      </div>
      <div class="footer-right">
        <a v-if="cfg.footer?.bottom?.theme" :href="cfg.footer.bottom.theme.url" target="_blank" rel="noopener"
          class="theme-link">
          <i :class="cfg.footer.bottom.theme.icon"></i> {{ cfg.footer.bottom.theme.text }}
        </a>
        <a v-if="cfg.footer?.bottom?.license" :href="cfg.footer.bottom.license.url" target="_blank" rel="noopener"
          class="cc-link" :aria-label="cfg.footer.bottom.license.name">
          <i v-for="(icon, i) in cfg.footer.bottom.license.icons" :key="i" :class="icon"></i>
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
interface NavItem { text: string; href: string; external?: boolean; }
interface SocialLink { name: string; url: string; icon: string; external?: boolean; }
interface Config {
  home: {
    typedName: string;
    navigation: NavItem[];
    footer: { copyright: string; year: number; github: string };
  };
  about: {
    avatar: { src: string; alt: string };
    name: { main: string; sub: string };
    oneLiner: { enabled?: boolean; text: string; typeSpeed?: number; showCursor?: boolean };
    quote: { en: string; cn: string };
    socialLinks: SocialLink[];
  };
  reserved: { title: string; description: string };
  pageSwitcher: { totalPages?: number; scrollThreshold?: number; scrollCooldown?: number };
  footer?: {
    enabled?: boolean;
    socialLinks?: Array<{
      name: string;
      url: string;
      icon: string;
    }>;
    linkColumns?: Array<{
      title: string;
      links: Array<{
        text: string;
        url: string;
        external?: boolean;
      }>;
    }>;
    bottom?: {
      copyright?: {
        author: string;
        startYear: number;
      };
      theme?: {
        text: string;
        url: string;
        icon: string;
      };
      license?: {
        name: string;
        url: string;
        icons: string[];
      };
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
const props = defineProps<{
  name?: string;
  config?: Config;
  isHome: boolean;
}>();
const cfg = computed(() => ({
  ...(props.config || {})
}));
const leftColRef = ref<HTMLElement | null>(null);
const linksContainerRef = ref<HTMLElement | null>(null);
const typewriterRef = ref<HTMLElement | null>(null);
const currentYear = new Date().getFullYear();
const displayedPoem = ref('');
const isTyping = ref(false);
let typed: any = null;
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
const initPoemTypewriter = async () => {
  if (!typewriterRef.value || !cfg.value.footer?.poem?.enabled) return;
  const poemConfig = cfg.value.footer?.poem;
  const getPoemText = (): Promise<string> => {
    if (poemConfig.source === 'custom') {
      return Promise.resolve(poemConfig.customText || '');
    }
    return new Promise((resolve) => {
      import('jinrishici').then(({ default: jinrishici }) => {
        jinrishici.load((result: { data: { content: string } }) => {
          resolve(result.data.content);
        }, () => {
          resolve(poemConfig.customText || '「诗词加载失败」');
        });
      }).catch(() => {
        resolve(poemConfig.customText || '「诗词加载失败」');
      });
    });
  };
  const poem = await getPoemText();
  if (!poem || !typewriterRef.value) return;
  const Typed = (await import('typed.js')).default;
  typed = new Typed(typewriterRef.value, {
    strings: [poem],
    typeSpeed: poemConfig.typeSpeed || 80,
    backSpeed: poemConfig.backSpeed || 40,
    backDelay: poemConfig.backDelay || 2000,
    loop: poemConfig.loop !== false,
    showCursor: false,
    onStart: () => { isTyping.value = true; },
    onComplete: () => { isTyping.value = false; }
  });
};
const syncFooterLayout = () => {
  const leftCol = leftColRef.value;
  const linksContainer = linksContainerRef.value;
  if (!leftCol || !linksContainer) return;
  const isWide = window.innerWidth >= 900;
  const isInContainer = leftCol.parentElement === linksContainer;
  if (isWide && !isInContainer) {
    linksContainer.insertBefore(leftCol, linksContainer.firstChild);
  } else if (!isWide && isInContainer) {
    linksContainer.parentNode?.insertBefore(leftCol, linksContainer);
  }
};
const handleResize = () => {
  clearTimeout(resizeTimer || undefined);
  resizeTimer = setTimeout(syncFooterLayout, 100);
};
onMounted(() => {
  syncFooterLayout();
  initPoemTypewriter();
  window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (resizeTimer) clearTimeout(resizeTimer);
  if (typed) typed.destroy();
});
</script>

<style scoped>
.site-footer {
  background: var(--background);
  border-top: 1px solid var(--border);
  padding: 2rem 1rem 1rem;
  font-size: 0.9rem;
  color: var(--foreground);
}

.footer-main {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
}

.footer-main {
  flex-direction: column;
  align-items: center;
}

@media (min-width: 900px) {
  .footer-main {
    flex-direction: row;
  }
}

.footer-left-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.footer-video {
  width: 100%;
  display: flex;
  justify-content: center;
}

.avatar-video {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 2px solid var(--border);
  transition: border-color 0.3s;
}

.avatar-video:hover {
  border-color: var(--accent);
}

.footer-social {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  max-width: calc(36px * 5 + 0.5rem * 4);
}

.social-btn {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--muted);
  color: var(--foreground);
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.2s ease;
}

.social-btn:hover {
  background: var(--accent);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.2rem 2rem;
  flex: 1;
  min-width: 0;
  margin-bottom: 1rem;
}

.link-column {
  flex: 0 0 120px;
  min-width: 120px;
  overflow: hidden;
}

.link-column h4 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.8rem;
  color: var(--foreground);
  border-bottom: 2px solid var(--accent);
  padding-bottom: 0.4rem;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.link-column a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.2s;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-column a:hover {
  color: var(--accent);
}

@media (max-width: 768px) {
  .footer-main {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .footer-left-column {
    order: -1;
  }

  .footer-links {
    justify-content: center;
    gap: 1rem 1.5rem;
    width: 100%;
  }

  .link-column {
    flex: 0 0 100px;
    min-width: 100px;
  }

  .footer-social {
    max-width: 180px;
  }
}

@media (max-width: 899px) {
  .footer-left-column {
    margin-bottom: 1.5rem;
  }
}

.footer-video {
  flex-shrink: 0;
}

.avatar-video {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  pointer-events: none;
  user-select: none;
  background: var(--background);
  border: 2px solid var(--border);
  transition: border-color 0.3s;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.2rem 2rem;
  width: 100%;
}

.link-column {
  flex: 0 0 120px;
  min-width: 120px;
  overflow: hidden;
}

.link-column h4 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.8rem;
  color: var(--foreground);
  border-bottom: 2px solid var(--accent);
  padding-bottom: 0.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.link-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.link-column a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.link-column a:hover {
  color: var(--accent);
}

@media (max-width: 480px) {
  .footer-links {
    gap: 1rem 1.5rem;
    justify-content: flex-start;
    padding: 0 0.5rem;
  }

  .link-column {
    flex: 0 0 100px;
    min-width: 100px;
  }
}

@media (max-width: 768px) {
  .footer-links {
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 1rem 1.5rem;
  }
}

.footer-divider {
  height: 1px;
  background: var(--border);
  max-width: 1200px;
  margin: 1rem auto;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.copyright {
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.typewriter-container {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 1.2em;
}

.typewriter-text {
  color: var(--accent);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
}

.typewriter-cursor {
  color: var(--accent);
  font-weight: bold;
  animation: cursor-blink 1s step-end infinite;
}

.typewriter-cursor.blink {
  opacity: 1;
  animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
  50% {
    opacity: 0;
  }
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-link,
.cc-link {
  color: var(--vp-c-text-3);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: color 0.2s;
}

.theme-link:hover,
.cc-link:hover {
  color: var(--accent);
}

.cc-link i {
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .typewriter-container {
    display: none;
  }
}

@media (max-width: 768px) {
  .footer-main {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 2rem;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
    justify-items: center;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
    gap: 0.8rem;
  }

  .footer-left,
  .footer-right {
    justify-content: center;
  }

  .typewriter-text {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (max-width: 480px) {
  .footer-links {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }

  .avatar-video {
    width: 80px;
    height: 80px;
  }

  .social-btn {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .footer-bottom {
    padding: 0;
  }
}

html[data-theme="dark"] .avatar-video {
  border-color: var(--muted);
}

html[data-theme="dark"] .social-btn {
  background: var(--border);
}

html[data-theme="dark"] .social-btn:hover {
  background: var(--accent);
  box-shadow: 0 4px 12px rgba(255, 107, 1, 0.4);
}
</style>