<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="mb-4.5 flex items-center">
    <h3 class="font-logo text-[26px] leading-none tracking-[0.04em] uppercase">{{ title }}</h3>
    <span v-if="subtitle" class="text-dimmed ml-3 text-[12.5px]">{{ subtitle }}</span>
    <div v-if="$slots.actions" class="ml-auto">
      <slot name="actions" />
    </div>
  </div>
</template>
