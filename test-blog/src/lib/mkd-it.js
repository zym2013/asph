// src/mkd-it.js - Markdown-it 初始化模块
import MarkdownIt from 'markdown-it';
// import MarkdownItEmoji from 'markdown-it-emoji/lib/bare.mjs';
import MarkdownItFootnote from 'markdown-it-footnote';
import markdownItMath from 'markdown-it-math';
import MarkdownItAnchor from 'markdown-it-anchor';
import Shiki from '@shikijs/markdown-it';
import markdownItMark from 'markdown-it-mark';
import markdownItContainer from 'markdown-it-container';
import katex from 'katex';
import 'katex/contrib/mhchem';
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets';
import markdownItWrapperlessFenceRule from '@olets/markdown-it-wrapperless-fence-rule';
import {
	transformerNotationDiff,
	transformerNotationHighlight,
	transformerNotationFocus,
	transformerNotationErrorLevel,
	// transformerRenderWhitespace, // aaaa 有 bug
	transformerMetaHighlight,
	transformerMetaWordHighlight,
	transformerRemoveLineBreak,
	transformerRemoveNotationEscape,
	transformerNotationWordHighlight
} from '@shikijs/transformers';
import { transformerTwoslash } from '@shikijs/twoslash';
let mditInstance = null;
function parseContainerInfo(info) {
	const match = info.match(/^(\w+)[ \t]*(?:\[(.*?)\])?[ \t]*(?:\{(.*?)\})?/);
	if (!match) return { type: info, title: null, openAttr: '' };
	let [, type, title, params] = match;
	const openAttr = params && params.includes('open') ? 'open' : '';
	return { type, title: title || null, openAttr };
}
// 👇 新增：GitHub 风格 Alerts（> [!NOTE] 等）
function setupAlerts(md) {
  // 类型映射：GitHub 关键字 / 中文 -> 统一类名
  const typeMap = {
    note: 'info', tip: 'tip', important: 'important', success: 'success',
    warning: 'warning', caution: 'caution', error: 'error', details: 'details', danger: 'danger',
    // 中文别名
    信息: 'info', 提示: 'tip', 重点: 'important', 成功: 'success',
    警告: 'warning', 注意: 'caution', 错误: 'error', 详情: 'details', 危险: 'danger'
  };

  // 图标映射
  const iconMap = {
    info: 'fa-circle-info', tip: 'fa-lightbulb', important: 'fa-bullhorn',
    success: 'fa-circle-check', warning: 'fa-triangle-exclamation', caution: 'fa-fire',
    error: 'fa-circle-xmark', details: 'fa-circle-question', danger: 'fa-skull'
  };

  let inAlert = false;
  const defaultBqOpen = md.renderer.rules.blockquote_open || (() => '<blockquote>\n');

  // 拦截 blockquote 开始标签
  md.renderer.rules.blockquote_open = (tokens, idx, opts, env, self) => {
    const next = tokens[idx + 1];
    if (next?.type === 'inline' && /^\[!\w+\]/i.test(next.content)) {
      const match = next.content.match(/^\[!\s*(\w+)\s*\](?:\s+(.+))?/i);
      if (match) {
        inAlert = true;
        const rawType = match[1].toLowerCase();
        const type = typeMap[rawType] || rawType;
        const title = match[2] || type.charAt(0).toUpperCase() + type.slice(1);
        const icon = iconMap[type] || iconMap.info;
        
        // 移除原文中的 [!TYPE] 标记，保留后续内容
        next.content = next.content.replace(/^\[!\w+\]\s*/i, '').trim();
        
        // 返回统一类名的 div
        return `<div class="custom-block custom-block-${type}"><p class="custom-block-title"><i class="fa-solid ${icon}"></i> ${md.utils.escapeHtml(title)}</p>\n`;
      }
    }
    inAlert = false;
    return defaultBqOpen(tokens, idx, opts, env, self);
  };

  // 拦截 blockquote 结束标签
  md.renderer.rules.blockquote_close = (tokens, idx, opts, env, self) => {
    if (inAlert) {
      inAlert = false;
      return '</div>\n';
    }
    return '</blockquote>\n';
  };
}
function setupContainers(md) {
	const containers = [
		['info', '信息'],
		['tip', '提示'],
		['important', '重点'],
		['success', '成功'],
		['warning', '警告'],
		['caution', '注意'],
		['error', '错误'],
		['details', '详情'],
		['danger', '危险']];
	containers.forEach(c => {
		const containerType = c[0];
		const name = c.length > 1 ? c[1] : null;
		md.use(markdownItContainer, containerType, {
			validate(params) {
				return params.trim().startsWith(containerType);
			},
			render(tokens, idx) {
				const token = tokens[idx];
				const info = token.info.trim();
				const { type, title, openAttr } = parseContainerInfo(info);
				if (token.nesting === 1) {
					const summary = title || name || type || '详细信息';
					return `<details ${openAttr} class="custom-block ${type}"><summary>${md.render(summary).replace('<p>', '').replace('</p>', '')}</summary>\n`;
				}
				return `</details>\n`;
			}
		});
	});
}
export const disposeMarkdownIt = () => {
	mditInstance = null;
}
export const initMarkdownIt = async () => {
	if (!mditInstance) {
		const katexOptions = {
			throwOnError: false,
			errorColor: '#cc0000',
			strict: false,
			macros: {
				"\\resetcolor": "\\htmlClass{reset-color}"
			},
			trust: (context) => {
				if (context.command === '\\htmlClass' || context.command === '\\htmlStyle') {
					return true;
				}
				if (context.command === '\\href' || context.command === '\\url') {
					const protocol = context.protocol?.toLowerCase();
					const allowedProtocols = ['http:', 'https:', 'mailto:', 'ftp:'];
					return allowedProtocols.includes(protocol);
				}
				return false;
			},
		};
		const katexRenderer = {
			inlineRenderer: (str) => {
				try {
					return katex.renderToString(str, {
						...katexOptions,
						displayMode: false
					});
				} catch (error) {
					return `<span style="color: #cc0000">[公式错误: ${error.message}]</span>`;
				}
			},
			blockRenderer: (str) => {
				try {
					return katex.renderToString(str, {
						...katexOptions,
						displayMode: true
					});
				} catch (error) {
					return `<div style="color: #cc0000">[公式错误: ${error.message}]</div>`;
				}
			}
		};
		mditInstance = MarkdownIt({
			html: true,
			linkify: true,
			typographer: true,
			breaks: false
		});
		// mditInstance.renderer.rules.fence = markdownItWrapperlessFenceRule;
		mditInstance.use(markdownItMark);
		// mditInstance.use(MarkdownItEmoji);
		setupContainers(mditInstance);
    // setupAlerts(mditInstance);          // 👈 新增：GitHub Alerts
		mditInstance.use(await Shiki({
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			},
			transformers: [
				transformerColorizedBrackets(),
				transformerNotationDiff({
					matchAlgorithm: 'v3',
				}),
				transformerNotationHighlight({
					matchAlgorithm: 'v3',
				}),
				transformerNotationFocus({
					matchAlgorithm: 'v3',
				}),
				transformerNotationErrorLevel({
					matchAlgorithm: 'v3',
				}),
				transformerMetaHighlight({
					matchAlgorithm: 'v3',
				}),
				transformerMetaWordHighlight({
					matchAlgorithm: 'v3',
				}),
				transformerRemoveLineBreak({
					matchAlgorithm: 'v3',
				}),
				transformerRemoveNotationEscape({
					matchAlgorithm: 'v3',
				}),
				transformerNotationWordHighlight({
					matchAlgorithm: 'v3',
				}),
				// transformerRenderWhitespace({
				// 	matchAlgorithm: 'v3',
				// 	position: 'all',
				// }),
				{
					code(node) {
						if (!node.properties.class) return
						const classes = Array.isArray(node.properties.class)
							? node.properties.class
							: String(node.properties.class).split(' ')
						const langClass = classes.find(c => c.startsWith('language-'))
						if (langClass) {
							const lang = langClass.replace('language-', '')
							node.properties['code-language'] = lang
						}
					}
				},
				transformerTwoslash({
					disableTriggers: ['notwoslash', 'no-twoslash'],
					rendererRich: {
						errorRendering: 'hover',
					},
				}),
			]
		}));
		mditInstance.use(MarkdownItFootnote);
		mditInstance.use(MarkdownItAnchor, {
			slugify: s => {
				const slug = String(s).trim().toLowerCase().replace(/\s+/g, '-');
				return encodeURIComponent(slug);
			},
			permalink: true,
			permalinkSymbol: '¶',
			renderPermalink: (slug, opts, state, idx) => {
				const token = state.tokens[idx + 1];
				if (!token || !token.children) return;
				const text = new state.Token('text', '', 0);
				text.content = ' ';
				const linkOpen = new state.Token('link_open', 'a', 1);
				const hrefBase = typeof location !== 'undefined' && location.href ? location.href.split('#')[0] : '';
				linkOpen.attrs = [['href', `${hrefBase}#${slug}`], ['class', 'header-anchor']];
				const symbol = new state.Token('html_inline', '', 0);
				symbol.content = opts.permalinkSymbol || '¶';
				const linkClose = new state.Token('link_close', 'a', -1);
				token.children.push(text, linkOpen, symbol, linkClose);
			}
		});
		mditInstance.use(markdownItMath, {
			inlineOpen: '$',
			inlineClose: '$',
			blockOpen: '$$',
			blockClose: '$$',
			...katexRenderer
		});
		console.log('Markdown-it initialized');
	}
	return mditInstance;
};