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

const { t } = useI18n()

const rangeFrom = computed(() => (total === 0 ? 0 : (page - 1) * limit + 1))
const rangeTo = computed(() => Math.min(page * limit, total))

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
    <UPagination
      :page
      :items-per-page="limit"
      :total
      variant="subtle"
      @update:page="emit('update:page', $event)"
    />

    <div class="flex items-center gap-4">
      <span v-if="total > 0" class="text-dimmed text-xs">
        {{ t('common.pagination.range', { from: rangeFrom, to: rangeTo, total }) }}
      </span>

      <div class="flex items-center gap-2">
        <span class="text-muted text-sm">{{ t('common.pagination.perPage') }}</span>
        <USelectMenu
          :model-value="limit"
          :items="limitOptions"
          value-key="value"
          :search-input="false"
          :ui="{ item: 'cursor-pointer' }"
          @update:model-value="onLimitChange"
        />
      </div>
    </div>
  </div>
</template>
