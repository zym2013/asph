// src/lib/color.ts

/**
 * 将 HEX 颜色 (#RRGGBB) 转换为带透明度的格式 (#RRGGBBAA)
 * @param hex 颜色值，如 '#ff6b6b' 或 'var(--accent)'
 * @param opacity 不透明度 0-1，默认 0.7（70%）
 * @returns 处理后的颜色字符串
 */
export function withOpacity(hex: string, opacity: number = 0.7): string {
  // 如果是 CSS 变量，直接返回 + opacity 组合
  if (hex.startsWith('var(')) {
    return `color-mix(in srgb, ${hex}, transparent ${Math.round((1 - opacity) * 100)}%)`;
  }
  
  // 移除 # 号
  const cleanHex = hex.replace('#', '');
  
  // 支持 3 位简写 (#fff → #ffffff)
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
  
  // 验证格式
  if (!/^[0-9A-Fa-f]{6}$/.test(fullHex)) {
    console.warn(`Invalid hex color: ${hex}`);
    return hex;
  }
  
  // 计算透明度通道：0.7 → 179 → 'B3'
  const alpha = 70;
  
  return `#${fullHex}${alpha}`;
}

/**
 * 解析颜色：支持直接传带透明度的 HEX，或自动添加 70% 透明度
 */
export function parseColor(color: string | undefined, defaultHex: string = '#64748b'): string {
  if (!color) return withOpacity(defaultHex);
  
  // 如果已经是 8 位 HEX 或 CSS 变量，直接返回
  if (/^#[0-9A-Fa-f]{8}$/.test(color) || color.startsWith('var(')) {
    return color;
  }
  
  // 否则添加 70% 透明度
  return withOpacity(color);
}