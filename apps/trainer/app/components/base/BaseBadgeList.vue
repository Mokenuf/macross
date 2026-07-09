<script setup lang="ts">
const {
  items,
  color = 'primary',
  max = 2,
  empty = '—',
} = defineProps<{
  items: string[]
  color?: 'primary' | 'info' | 'success' | 'warning' | 'error' | 'neutral'
  max?: number
  empty?: string
}>()
</script>

<template>
  <span v-if="items.length === 0" class="text-muted">{{ empty }}</span>
  <div v-else class="flex items-center gap-1.5">
    <template v-if="items.length <= max">
      <UBadge v-for="item in items" :key="item" :color>{{ item }}</UBadge>
    </template>
    <UTooltip v-else :text="items.join(', ')">
      <UBadge :color class="cursor-default">+{{ items.length }}</UBadge>
    </UTooltip>
  </div>
</template>
