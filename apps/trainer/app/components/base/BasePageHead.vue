<script setup lang="ts">
const { loading = false } = defineProps<{ loading?: boolean; title: string; subtitle?: string }>()
</script>

<template>
  <div class="mb-4.5 flex items-center">
    <h3 class="font-logo text-2xl leading-none tracking-wider uppercase">{{ title }}</h3>
    <span v-if="subtitle && !loading" class="text-dimmed ml-3 text-sm">{{ subtitle }}</span>
    <div v-if="$slots.actions" class="ml-auto">
      <slot name="actions" />
    </div>
  </div>
</template>
