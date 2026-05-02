<template>
	<div class="home-container">
		<div class="pages-wrapper" :style="{ transform: `translateY(-${currentPage * 100}vh)` }" @wheel="handleWheel"
			@touchstart="handleTouchStart" @touchend="handleTouchEnd">
			<section class="page page-home">
				<div class="center-wrap">
					<main class="card" role="main" aria-labelledby="site-title">
						<div class="header-group">
							<div class="avatar-container" :class="{ show: typedDone }">
								<video class="avatar-video" src="/fav.mp4" autoplay loop muted playsinline webkit-playsinline
									preload="auto" referrerpolicy="no-referrer" crossorigin="anonymous" />
							</div>
							<h1 id="site-title">
								<span class="typed-container">
									<span ref="typedEl"></span>
								</span>
							</h1>
						</div>
						<nav class="links" :class="{ show: typedDone }" aria-label="主要链接">
							<template v-for="(item, index) in config?.home?.navigation || []" :key="index">
								<a class="link" :href="item.href" :target="item.external ? '_blank' : undefined"
									:rel="item.external ? 'noopener' : undefined">
									{{ item.text }}
								</a>
								<span v-if="index < (config?.home?.navigation?.length || 0) - 1" class="sep">｜</span>
							</template>
						</nav>
						<footer>
							<div class="text-muted small" :class="{ show: typedDone }">
								Copyright ©
								<a :href="config?.home?.footer?.github" target="_blank" rel="noopener" class="text-decoration-none">
									{{ config?.home?.footer?.copyright }}
								</a>
								{{ config?.home?.footer?.year }}. All rights reserved.
							</div>
						</footer>
					</main>
				</div>
			</section>
			<section class="page page-about">
				<div class="about-content">
					<div class="about-section section-intro">
						<div class="intro-avatar">
							<img :src="config?.about?.avatar?.src" :alt="config?.about?.avatar?.alt || 'asph'"
								class="avatar-rounded" referrerpolicy="no-referrer" crossorigin="anonymous" />
						</div>
						<div class="intro-text">
							<div class="name-row">
								<span class="name-main">{{ config?.about?.name?.main }}</span>
								<span class="name-sub">{{ config?.about?.name?.sub }}</span>
							</div>
							<p class="one-liner" ref="oneLinerEl" v-if="config?.about?.oneLiner?.enabled !== false">
								{{ config?.about?.oneLiner?.text }}
							</p>
						</div>
					</div>
					<div class="about-section section-quote">
						<blockquote class="quote-en">{{ config?.about?.quote?.en }}</blockquote>
						<p class="quote-cn">{{ config?.about?.quote?.cn }}</p>
					</div>
					<div class="about-section section-social">
						<a v-for="(link, index) in (config?.about?.socialLinks || [])" :key="index" :href="link.url"
							:target="link.external ? '_blank' : undefined" :rel="link.external ? 'noopener noreferrer' : undefined"
							class="social-link">
							<i :class="link.icon"></i> {{ link.name }}
						</a>
					</div>
				</div>
			</section>
			<section class="page page-reserved">
				<div class="reserved-content">
					<h2>{{ config?.reserved?.title }}</h2>
					<p>{{ config?.reserved?.description }}</p>
				</div>
			</section>
		</div>
		<div class="page-indicator">
			<button v-for="index in totalPages" :key="index" class="indicator-dot"
				:class="{ active: currentPage === index - 1 }" @click="goToPage(index - 1)" :aria-label="`跳转到第 ${index} 页`">
				<span class="dot-inner"></span>
			</button>
		</div>
		<div class="page-switcher">
			<button class="switch-btn prev" @click="prevPage" :disabled="currentPage === 0" aria-label="上一页">
				<i class="fa-solid fa-chevron-up"></i>
			</button>
			<div class="page-info">
				<span class="page-current">{{ currentPage + 1 }}</span>
				<span class="page-sep">/</span>
				<span class="page-total">{{ totalPages }}</span>
			</div>
			<button class="switch-btn next" @click="nextPage" :disabled="currentPage === totalPages - 1" aria-label="下一页">
				<i class="fa-solid fa-chevron-down"></i>
			</button>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
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
}
const props = defineProps<{
	name?: string;
	config?: Config;
}>();
const cfg = computed(() => ({
	...(props.config || {})
}));
const currentPage = ref(0);
const totalPages = computed(() => cfg.value.pageSwitcher?.totalPages || 3);
const isScrolling = ref(false);
const touchStartY = ref(0);
const scrollThreshold = computed(() => cfg.value.pageSwitcher?.scrollThreshold || 50);
const scrollCooldown = computed(() => cfg.value.pageSwitcher?.scrollCooldown || 600);
const typedEl = ref<HTMLElement | null>(null);
const typedDone = ref(false);
const goToPage = (index: number) => {
	if (isScrolling.value) return;
	currentPage.value = Math.max(0, Math.min(index, totalPages.value - 1));
};
const nextPage = () => goToPage(currentPage.value + 1);
const prevPage = () => goToPage(currentPage.value - 1);
const handleWheel = (e: WheelEvent) => {
	if (isScrolling.value) return;
	e.preventDefault();
	const delta = e.deltaY;
	if (delta > scrollThreshold.value) {
		nextPage();
	} else if (delta < -scrollThreshold.value) {
		prevPage();
	}
	isScrolling.value = true;
	setTimeout(() => { isScrolling.value = false; }, scrollCooldown.value);
};
const handleTouchStart = (e: TouchEvent) => {
	touchStartY.value = e.touches[0].clientY;
};
const handleTouchEnd = (e: TouchEvent) => {
	if (isScrolling.value) return;
	const touchEndY = e.changedTouches[0].clientY;
	const diff = touchStartY.value - touchEndY;
	if (diff > scrollThreshold.value) {
		nextPage();
	} else if (diff < -scrollThreshold.value) {
		prevPage();
	}
	isScrolling.value = true;
	setTimeout(() => { isScrolling.value = false; }, scrollCooldown.value);
};
const handleKeydown = (e: KeyboardEvent) => {
	if (isScrolling.value) return;
	if (e.key === 'ArrowDown' || e.key === 'PageDown') {
		e.preventDefault();
		nextPage();
	} else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
		e.preventDefault();
		prevPage();
	}
};
onMounted(() => {
	const loadTyped = () => {
		if (!(window as any).Typed) {
			const script = document.createElement('script');
			script.src = 'https://unpkg.com/typed.js@2.1.0/dist/typed.umd.js';
			script.onload = initTyped;
			document.head.appendChild(script);
		} else {
			initTyped();
		}
	};
	const initTyped = () => {
		const Typed = (window as any).Typed;
		if (!typedEl.value) return;
		new Typed(typedEl.value, {
			strings: [cfg.value.home?.typedName || props.name || 'asph'],
			typeSpeed: 80,
			backSpeed: 0,
			startDelay: 300,
			showCursor: true,
			cursorChar: '|',
			loop: false,
			onComplete: () => {
				setTimeout(() => { typedDone.value = true; }, 500);
			}
		});
	};
	loadTyped();
	window.addEventListener('keydown', handleKeydown);
});
onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown);
});
</script>
<style scoped>
.home-container {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	background: var(--background);
	color: var(--foreground);
}

.pages-wrapper {
	display: flex;
	flex-direction: column;
	height: 100vh;
	transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform;
}

.page {
	flex: 0 0 100vh;
	width: 100%;
	display: flex;
	justify-content: center;
	padding: 2rem;
	box-sizing: border-box;
}

.page-home {}

.header-group {
	display: flex;
	align-items: center;
	gap: 1.5rem;
	margin-bottom: 2rem;
}

.avatar-container {
	width: 100px;
	height: 100px;
	border-radius: 50%;
	overflow: hidden;
	opacity: 0;
	transform: translateY(20px) scale(0.9);
	transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
	-webkit-mask-image: radial-gradient(circle, black 70%, transparent 100%);
	mask-image: radial-gradient(circle, black 70%, transparent 100%);
	display: flex;
	justify-content: center;
	align-items: center;
}

.avatar-container.show {
	opacity: 1;
	transform: translateY(0) scale(1);
}

.avatar-video {
	width: 100%;
	height: 100%;
	object-fit: cover;
	border-radius: 50%;
	display: block;
	pointer-events: none;
	user-select: none;
	background: var(--background);
}

#site-title {
	margin: 0;
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--vp-c-text-1);
	line-height: 1.2;
}

.sep {
	color: var(--border);
}

.text-muted.small.show {
	opacity: 0;
	transform: translateY(10px);
	transition: opacity 0.5s, transform 0.5s;
}

.text-muted.small.show {
	opacity: 1;
	transform: translateY(0);
}

.page-about {
	align-items: flex-start;
	justify-content: center;
}

.about-content {
	width: 100%;
	max-width: 800px;
	display: flex;
	flex-direction: column;
	gap: 2rem;
	padding: 2rem 0;
}

.section-intro {
	display: flex;
	align-items: center;
	gap: 2rem;
}

.intro-avatar {
	flex-shrink: 0;
}

.avatar-rounded {
	width: 150px;
	height: 150px;
	border-radius: 24px;
	object-fit: cover;
	display: block;
	border: 3px #eee solid;
}

.intro-text {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.name-row {
	display: flex;
	align-items: baseline;
	gap: 0.75rem;
}

.name-main {
	font-size: 2.8rem;
	font-weight: 700;
	color: var(--foreground);
}

.name-sub {
	font-size: 2rem;
	color: var(--vp-c-text-2);
	font-weight: 400;
}

.one-liner {
	font-size: 1.5rem;
	color: var(--accent);
	font-style: italic;
	margin: 0;
}

.section-quote {
	border-left: 3px #eee solid;
	padding: 1rem 2rem;
}

.quote-en {
	font-size: 1.3rem;
	font-weight: 500;
	color: var(--foreground);
	margin: 0 0 0.75rem;
	line-height: 1.5;
}

.quote-cn {
	font-size: 1.1rem;
	color: var(--vp-c-text-2);
	margin: 0;
	line-height: 1.6;
}

.section-social {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem 2rem;
	justify-content: center;
}

.social-link {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	color: var(--vp-c-text-2);
	text-decoration: none;
	font-size: 1rem;
	transition: color 0.2s, transform 0.2s;
}

.social-link:hover {
	color: var(--accent);
	transform: translateY(-2px);
}

.social-link i {
	font-size: 1.1rem;
}

.page-reserved {
	text-align: center;
}

.reserved-content h2 {
	font-size: 2rem;
	font-weight: 600;
	color: var(--accent);
	margin-bottom: 1rem;
}

.reserved-content p {
	color: var(--vp-c-text-2);
	font-size: 1.1rem;
}

.page-indicator {
	position: fixed;
	right: 2rem;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
	z-index: 100;
}

.indicator-dot {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: transparent;
	border: 2px solid var(--border);
	padding: 0;
	cursor: pointer;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.indicator-dot.active {
	border-color: var(--accent);
	background: var(--accent);
}

.dot-inner {
	width: 4px;
	height: 4px;
	border-radius: 50%;
	background: var(--background);
	opacity: 0;
	transition: opacity 0.2s;
}

.indicator-dot.active .dot-inner {
	opacity: 1;
}

.indicator-dot:hover {
	border-color: var(--accent);
	transform: scale(1.1);
}

.page-switcher {
	position: fixed;
	bottom: 2rem;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	gap: 1rem;
	background: rgba(var(--background-rgb, 255, 255, 255), 0.9);
	backdrop-filter: blur(8px);
	padding: 0.5rem 1rem;
	border-radius: 999px;
	border: 1px solid var(--border);
	z-index: 100;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

html[data-theme="dark"] .page-switcher {
	background: rgba(20, 20, 20, 0.9);
	border-color: rgba(255, 255, 255, 0.1);
}

.switch-btn {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: var(--muted);
	border: none;
	color: var(--foreground);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
	font-size: 0.9rem;
}

.switch-btn:hover:not(:disabled) {
	background: var(--accent);
	color: #fff;
	transform: scale(1.05);
}

.switch-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
	transform: none;
}

.page-info {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.9rem;
	font-weight: 500;
	color: var(--vp-c-text-2);
}

.page-current {
	color: var(--accent);
	font-size: 1.1rem;
}

.page-sep {
	opacity: 0.5;
}

@media (max-width: 768px) {
	.header-group {
		flex-direction: column;
		text-align: center;
	}

	.section-intro {
		flex-direction: column;
		text-align: center;
	}

	.name-row {
		justify-content: center;
	}

	.page-indicator {
		right: 1rem;
	}

	.page-switcher {
		bottom: 1rem;
		padding: 0.4rem 0.8rem;
	}

	.switch-btn {
		width: 28px;
		height: 28px;
		font-size: 0.8rem;
	}

	.avatar-rounded {
		width: 100px;
		height: 100px;
		border-radius: 20px;
	}

	.name-main {
		font-size: 1.5rem;
	}

	.name-sub {
		font-size: 1rem;
	}

	.quote-en {
		font-size: 1.1rem;
	}

	.quote-cn {
		font-size: 1rem;
	}
}

html[data-theme="dark"] .page-switcher {
	background: rgba(20, 20, 20, 0.9);
	border-color: rgba(255, 255, 255, 0.1);
}

.one-liner .typed-cursor {
	color: var(--accent);
	font-size: 1.5rem;
	animation: blink 0.7s infinite;
}

@keyframes blink {

	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0;
	}
}
</style>