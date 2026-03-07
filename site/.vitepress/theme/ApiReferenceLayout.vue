<script setup lang="ts">
import { useData } from "vitepress";
import VPNav from "vitepress/dist/client/theme-default/components/VPNav.vue";
import { computed } from "vue";

const { lang } = useData();

const iframeSrc = computed(() => {
  const base = import.meta.env.BASE_URL || "/ksef-docs/";
  const l = lang.value || "pl";
  return `${base}${l}/open-api.html`;
});
</script>

<template>
  <VPNav />
  <iframe class="api-reference-iframe" :src="iframeSrc" allowfullscreen />
</template>

<style scoped>
.api-reference-iframe {
  position: fixed;
  top: var(--vp-nav-height, 64px);
  left: 0;
  width: 100%;
  height: calc(100vh - var(--vp-nav-height, 64px));
  border: none;
}
</style>
