<script setup lang="ts">
import type { AcceptableValue, SelectItem } from '@nuxt/ui'

interface BasePaginationProps {
  page: number
  limit: number
  total: number
}
interface BasePaginationEmits {
  'update:page': [value: number]
  'update:limit': [value: number]
}

const { page, limit, total } = defineProps<BasePaginationProps>()
const emit = defineEmits<BasePaginationEmits>()

const limitOptions: SelectItem[] = [
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
]

function onLimitChange(value: AcceptableValue | undefined) {
  if (!value) return
  emit('update:limit', Number(value))
  emit('update:page', 1)
}
</script>

<template>
  <div class="flex items-center justify-between">
    <UPagination :page :items-per-page="limit" :total @update:page="emit('update:page', $event)" />

    <div class="flex items-center gap-2">
      <span class="text-sm text-neutral-400">Resultados por página</span>
      <USelect
        :model-value="limit"
        :items="limitOptions"
        @update:model-value="onLimitChange"
        class="cursor-pointer"
        :ui="{ item: 'cursor-pointer' }"
      />
    </div>
  </div>
</template>
