<template>
  <button class="theme-toggle" @click="toggleTheme" :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'">
    <i :class="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  const theme = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

onMounted(() => {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDark.value = saved === 'dark' || (!saved && prefersDark);
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
});
</script>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.2s;
  z-index: 100;
  color: var(--foreground);
}

.theme-toggle:hover {
  transform: scale(1.1);
  background: var(--muted);
}
</style>