<script setup lang="ts">
import type { Unit } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'units.title' })

const { t } = useI18n()
const { localizedName } = useLocalizedName()
const { kindLabels } = useUnitOptions()
const { units, pagination, counts, loading, page, limit, search } = useGetUnitList()
const { remove } = useDeleteUnit()
const { data: user } = useGetMe()

const BaseBadge = resolveComponent('BaseBadge')

const isManager = computed(() => user.value?.role === 'manager')

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('units.title') },
])

const filterConfig: Filter[] = [
  {
    type: 'search',
    key: 'search',
    label: t('filters.search'),
    placeholder: t('units.filters.searchPlaceholder'),
    debounce: 300,
  },
]

const filterValues = computed(() => ({ search: search.value }))

const columns = computed<TableColumn<Unit>[]>(() => [
  {
    id: 'name',
    header: t('units.columns.name'),
    accessorFn: row => localizedName(row),
    cell: ({ row }) =>
      h('span', { class: 'inline-flex items-center gap-2' }, [
        localizedName(row.original),
        row.original.isDefault ? h(BaseBadge, { label: t('units.default') }) : null,
      ]),
  },
  {
    id: 'kind',
    header: t('units.columns.kind'),
    accessorFn: row => kindLabels.value[row.kind],
  },
])

const actions: TableAction<Unit>[] = [
  { type: 'view', href: row => `/units/${row.slug}` },
  { type: 'edit', href: row => `/units/${row.slug}/edit`, visible: isManager },
  {
    type: 'delete',
    onSelect: row => remove(row.slug),
    visible: row => isManager.value && !row.isDefault,
  },
]

function onFilterUpdate({ key, value }: { key: string; value: string | number | string[] }) {
  const map: Record<string, Ref | WritableComputedRef<string | number | string[]>> = { search }
  if (map[key]) map[key].value = value
}
</script>

<template>
  <div class="space-y-4">
    <BasePageHead
      :loading
      :breadcrumbs
      :title="t('units.title')"
      :subtitle="t('units.count', { count: counts?.active ?? 0 })"
    >
      <template #actions>
        <UButton
          v-if="isManager"
          :label="t('units.add')"
          icon="i-lucide-plus"
          color="primary"
          to="/units/add"
        />
      </template>
    </BasePageHead>
    <BaseFilters :filters="filterConfig" :values="filterValues" @update:filters="onFilterUpdate" />

    <BaseTable
      :columns
      :actions
      :data="units"
      :loading
      :pagination
      :delete-label="row => localizedName(row)"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
