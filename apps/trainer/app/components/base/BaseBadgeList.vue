<script setup lang="ts">
interface BaseBadgeListProps {
  items: string[]
  color?: 'primary' | 'info' | 'success' | 'warning' | 'error' | 'neutral'
  max?: number
  empty?: string
}

const { items, color = 'primary', max = 2, empty = '—' } = defineProps<BaseBadgeListProps>()
</script>

<template>
  <span v-if="items.length === 0" class="text-muted">{{ empty }}</span>
  <div v-else class="flex items-center gap-1.5">
    <template v-if="items.length <= max">
      <BaseBadge v-for="item in items" :key="item" :label="item" :color />
    </template>
    <UTooltip v-else :text="items.join(', ')">
      <BaseBadge :label="`+${items.length}`" :color class="cursor-default" />
    </UTooltip>
  </div>
</template>
