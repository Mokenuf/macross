<script setup lang="ts">
import type { Filter } from '@/types/base-filters'

interface BaseFiltersProps {
  filters: Filter[]
  values: Record<string, string | number>
}
interface BaseFiltersEmits {
  'update:filters': [payload: { key: string; value: string | number }]
}

const { filters } = defineProps<BaseFiltersProps>()
const emit = defineEmits<BaseFiltersEmits>()

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {}

function onFilterChange(filter: Filter, value: string | number | undefined | null) {
  if (value === undefined || value === null) return

  if (filter.type === 'search' && filter.debounce) {
    clearTimeout(debounceTimers[filter.key])
    debounceTimers[filter.key] = setTimeout(() => {
      emit('update:filters', { key: filter.key, value })
    }, filter.debounce)
  } else {
    emit('update:filters', { key: filter.key, value })
  }
}
</script>

<template>
  <div class="flex items-center gap-3">
    <template v-for="filter in filters" :key="filter.key">
      <UInput
        v-if="filter.type === 'search'"
        :placeholder="filter.placeholder"
        :model-value="String(values[filter.key] ?? '')"
        icon="i-lucide-search"
        @update:model-value="onFilterChange(filter, $event)"
      />
      <USelectMenu
        v-else-if="filter.type === 'select'"
        :placeholder="filter.placeholder"
        :items="filter.options"
        value-key="value"
        :search-input="filter.searchable ? undefined : false"
        :model-value="values[filter.key]"
        @update:model-value="onFilterChange(filter, $event as string)"
      />
    </template>
  </div>
</template>
