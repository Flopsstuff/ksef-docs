<script setup lang="ts">
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import ApiReferenceLayout from "./ApiReferenceLayout.vue";

const { Layout } = DefaultTheme;
const { frontmatter } = useData();
</script>

<template>
  <ApiReferenceLayout v-if="frontmatter.apiReference" />
  <Layout v-else />
</template>
