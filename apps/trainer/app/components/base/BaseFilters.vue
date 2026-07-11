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

function onSelectClear(filter: Filter) {
  draft[filter.key] = filter.type === 'select' && filter.multiple ? [] : ''
}

function hasSelection(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : value != null && value !== ''
}

// Sin fallback a String(v): si el label no se puede resolver (opciones async todavía sin cargar,
// o un id stale) devolvemos '' y el trigger cae al placeholder, en vez de filtrar el UUID crudo.
function selectLabel(filter: Filter, value: unknown): string {
  if (filter.type !== 'select') return ''
  const options = filter.options as { label: string; value: string }[]
  const labelOf = (v: unknown) => options.find(o => o.value === v)?.label ?? ''
  if (Array.isArray(value)) {
    if (value.length === 0) return ''
    const first = labelOf(value[0])
    if (!first) return ''
    if (value.length === 1) return first
    return `${first} ${t('filters.andMore', { count: value.length - 1 })}`
  }
  return hasSelection(value) ? labelOf(value) : ''
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

    <div class="flex flex-wrap items-end gap-2.5">
      <template v-for="filter in filters" :key="filter.key">
        <UInput
          v-if="filter.type === 'search'"
          class="max-w-2xl min-w-40 flex-1"
          :placeholder="filter.placeholder"
          :model-value="String(values[filter.key] ?? '')"
          icon="i-lucide-search"
          @update:model-value="onSearchChange(filter, $event)"
        />
        <USelectMenu
          v-else-if="filter.type === 'select'"
          class="max-w-64 min-w-40"
          :clear="{ size: 'xs' }"
          :ui="{ itemTrailingIcon: 'hidden' }"
          :placeholder="filter.placeholder"
          :items="filter.options"
          value-key="value"
          :multiple="filter.multiple"
          :search-input="filter.searchable ? { icon: 'i-lucide-search' } : false"
          :model-value="draft[filter.key]"
          @update:model-value="onSelectChange(filter, $event)"
          @clear="onSelectClear(filter)"
        >
          <template #default="{ modelValue }">
            <span v-if="selectLabel(filter, modelValue)" class="truncate">
              {{ selectLabel(filter, modelValue) }}
            </span>
            <span v-else class="text-dimmed truncate">{{ filter.placeholder }}</span>
          </template>

          <template #item-leading>
            <span
              class="border-default group-data-[state=checked]:border-macross-bronze-soft group-data-[state=checked]:bg-macross-primary-400 group-data-[state=checked]:text-macross-primary-950 grid size-4 shrink-0 place-items-center rounded-xs border text-transparent"
            >
              <UIcon name="i-lucide-check" class="size-3" />
            </span>
          </template>
        </USelectMenu>
      </template>

      <template v-if="hasNonSearchFilters">
        <UButton
          :label="t('filters.apply')"
          color="primary"
          :disabled="!isDirty"
          @click="applyFilters"
        />
        <UButton
          :label="t('filters.clear')"
          color="neutral"
          variant="ghost"
          @click="clearFilters"
        />
      </template>
    </div>
  </div>
</template>
