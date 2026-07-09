<script setup lang="ts">
import type { BaseResponse, Equipment, Exercise, MuscleGroup } from '@macross/shared'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'exercises.title' })
const { t } = useI18n()
const { localizedName, localizedText } = useLocalizedName()

const { exercises, pagination, loading, page, limit, search, equipmentIds, muscleGroupIds } =
  useGetExerciseList()
const { remove } = useDeleteExercise()
const { data: user } = useGetMe()

const { data: muscleGroupsData } = useFetch<BaseResponse<MuscleGroup>>('/api/muscle-groups', {
  key: 'muscle-groups-select',
  query: { limit: 100 },
})
const { data: equipmentData } = useFetch<BaseResponse<Equipment>>('/api/equipment', {
  key: 'equipment-select',
  query: { limit: 100 },
})

const isManager = computed(() => user.value?.role === 'manager')

const muscleGroupOptions = computed(() =>
  (muscleGroupsData.value?.rows ?? []).map(mg => ({ label: localizedName(mg), value: mg.id })),
)
const equipmentOptions = computed(() =>
  (equipmentData.value?.rows ?? []).map(e => ({ label: localizedName(e), value: e.id })),
)

const filterConfig = computed<Filter[]>(() => [
  {
    type: 'search',
    key: 'search',
    label: t('filters.search'),
    placeholder: t('exercises.search'),
    debounce: 300,
  },
  {
    type: 'select',
    key: 'muscleGroupIds',
    label: t('exercises.filters.muscleGroup'),
    placeholder: t('exercises.filters.muscleGroupPlaceholder'),
    options: muscleGroupOptions.value,
    searchable: true,
    multiple: true,
  },
  {
    type: 'select',
    key: 'equipmentIds',
    label: t('exercises.filters.equipment'),
    placeholder: t('exercises.filters.equipmentPlaceholder'),
    options: equipmentOptions.value,
    searchable: true,
    multiple: true,
  },
])

const filterValues = computed(() => ({
  search: search.value,
  muscleGroupIds: muscleGroupIds.value,
  equipmentIds: equipmentIds.value,
}))

const UBadge = resolveComponent('UBadge')

const columns = computed<TableColumn<Exercise>[]>(() => [
  {
    id: 'name',
    header: t('exercises.columns.name'),
    accessorFn: row => localizedName(row),
    cell: ({ getValue }) =>
      h('span', { class: 'font-semibold text-highlighted' }, getValue<string>()),
  },
  {
    id: 'muscleGroups',
    header: t('exercises.columns.muscleGroups'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'flex flex-wrap gap-1.5' },
        row.original.muscleGroups.map(mg =>
          h(UBadge, { color: 'primary' }, () => localizedName(mg)),
        ),
      ),
  },
  {
    id: 'equipment',
    header: t('exercises.columns.equipment'),
    cell: ({ row }) => {
      const eq = row.original.equipment
      return eq ? h(UBadge, { color: 'neutral' }, () => localizedName(eq)) : '—'
    },
  },
  {
    id: 'description',
    header: t('exercises.columns.description'),
    accessorFn: row => localizedText(row.descriptionEs, row.descriptionEn) ?? '—',
  },
])

const actions: TableAction<Exercise>[] = [
  { type: 'view', href: row => `/exercises/${row.slug}` },
  { type: 'edit', href: row => `/exercises/${row.slug}/edit`, visible: isManager },
  { type: 'delete', onSelect: row => remove(row.slug), visible: isManager },
]

function onFilterUpdate({ key, value }: { key: string; value: string | number | string[] }) {
  const map: Record<string, Ref | WritableComputedRef<string | number | string[]>> = {
    search,
    muscleGroupIds,
    equipmentIds,
  }
  if (map[key]) map[key].value = value
}
</script>

<template>
  <div class="space-y-4">
    <BasePageHead :title="t('exercises.title')">
      <template #actions>
        <UButton
          v-if="isManager"
          :label="t('exercises.add')"
          icon="i-lucide-plus"
          color="primary"
          to="/exercises/add"
        />
      </template>
    </BasePageHead>
    <BaseFilters :filters="filterConfig" :values="filterValues" @update:filters="onFilterUpdate" />

    <BaseTable
      :columns
      :actions
      :data="exercises"
      :loading
      :pagination
      :delete-label="row => localizedName(row)"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
