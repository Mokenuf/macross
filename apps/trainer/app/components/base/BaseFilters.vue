<script setup lang="ts">
import type { Filter } from '@/types/base-filters'

type FilterValue = string | number | string[]

interface BaseFiltersProps {
  filters: Filter[]
  values: Record<string, FilterValue>
}
interface BaseFiltersEmits {
  'update:filters': [payload: { key: string; value: FilterValue }]
}

const { filters, values } = defineProps<BaseFiltersProps>()
const emit = defineEmits<BaseFiltersEmits>()

const { t } = useI18n()

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {}

// Los filtros no-search se difieren: viven acá hasta que el usuario toca "Aplicar". El search no.
const draft = reactive<Record<string, FilterValue>>({})

const nonSearchFilters = computed(() => filters.filter(f => f.type !== 'search'))
const hasNonSearchFilters = computed(() => nonSearchFilters.value.length > 0)
const isDirty = computed(() =>
  nonSearchFilters.value.some(f => !sameValue(draft[f.key], values[f.key])),
)

// Resync del draft con lo aplicado. Por contenido y solo no-search a propósito: tipear en el
// search recrea el objeto `values`, y un watch por referencia pisaría un select editado sin aplicar.
watch(
  () => JSON.stringify(nonSearchFilters.value.map(f => values[f.key])),
  () => syncDraft(),
)

function cloneValue(value: FilterValue): FilterValue {
  return Array.isArray(value) ? [...value] : value
}

function sameValue(a: FilterValue | undefined, b: FilterValue | undefined): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    const aa = Array.isArray(a) ? a.toSorted() : []
    const bb = Array.isArray(b) ? b.toSorted() : []
    return aa.length === bb.length && aa.every((v, i) => v === bb[i])
  }
  return a === b
}

function syncDraft() {
  for (const filter of nonSearchFilters.value) {
    draft[filter.key] = cloneValue(values[filter.key] ?? '')
  }
}

function onSearchChange(filter: Filter, value: FilterValue | undefined | null) {
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

// value es `unknown`: el model-value de USelectMenu es AcceptableValue (incluye bigint/boolean),
// más ancho que FilterValue. Con value-key + nuestras options el valor real siempre es FilterValue.
function onSelectChange(filter: Filter, value: unknown) {
  if (value === undefined || value === null) return
  draft[filter.key] = value as FilterValue
}

function applyFilters() {
  for (const filter of nonSearchFilters.value) {
    const value = draft[filter.key]
    if (value === undefined) continue
    emit('update:filters', { key: filter.key, value })
  }
}

function clearFilters() {
  for (const filter of filters) {
    if (filter.type === 'search') {
      clearTimeout(debounceTimers[filter.key])
      emit('update:filters', { key: filter.key, value: '' })
    } else {
      const resetValue = filter.default ?? (filter.multiple ? [] : '')
      draft[filter.key] = cloneValue(resetValue)
      emit('update:filters', { key: filter.key, value: resetValue })
    }
  }
}

syncDraft()
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm font-semibold">{{ t('filters.title') }}</h3>

    <div class="flex flex-wrap items-center gap-3">
      <template v-for="filter in filters" :key="filter.key">
        <UInput
          v-if="filter.type === 'search'"
          :placeholder="filter.placeholder"
          :model-value="String(values[filter.key] ?? '')"
          icon="i-lucide-search"
          @update:model-value="onSearchChange(filter, $event)"
        />
        <USelectMenu
          v-else-if="filter.type === 'select'"
          class="min-w-40"
          :placeholder="filter.placeholder"
          :items="filter.options"
          value-key="value"
          :multiple="filter.multiple"
          :search-input="filter.searchable ? undefined : false"
          :model-value="draft[filter.key]"
          @update:model-value="onSelectChange(filter, $event)"
        />
      </template>
    </div>

    <div v-if="hasNonSearchFilters" class="flex gap-3">
      <UButton
        :label="t('filters.apply')"
        icon="i-lucide-filter"
        color="primary"
        :disabled="!isDirty"
        @click="applyFilters"
      />
      <UButton
        :label="t('filters.clear')"
        icon="i-lucide-x"
        color="neutral"
        variant="outline"
        @click="clearFilters"
      />
    </div>
  </div>
</template>
