<script setup lang="ts">
import { Roles, type Trainer } from '@macross/shared'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

const { t } = useI18n()

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'trainers.title' })

const { trainers, pagination, loading, page, limit, search, role } = useGetTrainerList()
const { remove } = useDeleteTrainer()
const { data: user } = useGetMe()

const isManager = computed(() => user.value?.role === Roles.manager)

const filterConfig = computed<Filter[]>(() => [
  {
    type: 'search',
    key: 'search',
    label: t('trainers.search.label'),
    placeholder: t('trainers.search.placeholder'),
    debounce: 300,
  },
  {
    type: 'select',
    key: 'role',
    label: t('trainers.filters.roleLabel'),
    placeholder: t('trainers.filters.rolePlaceholder'),
    options: [
      { label: t('trainers.filters.roleOptions.trainer'), value: Roles.trainer },
      { label: t('trainers.filters.roleOptions.manager'), value: Roles.manager },
    ],
  },
])

const filterValues = computed(() => ({ search: search.value, role: role.value }))

const UBadge = resolveComponent('UBadge')
const roleBadge = computed(() => ({
  [Roles.trainer]: { label: t('trainers.roleBadges.trainer'), color: 'primary' },
  [Roles.manager]: { label: t('trainers.roleBadges.manager'), color: 'neutral' },
}))

const columns = computed<TableColumn<Trainer>[]>(() => [
  { accessorKey: 'fullName', header: t('trainers.columns.name') },
  { accessorKey: 'email', header: t('trainers.columns.email') },
  {
    accessorKey: 'role',
    header: t('trainers.columns.role'),
    cell: ({ row }) => {
      const rowValue = row.original.role
      return h(
        UBadge,
        { class: 'capitalize', variant: 'subtle', color: roleBadge.value[rowValue].color },
        () => roleBadge.value[rowValue].label,
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: t('trainers.columns.createdAt'),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('es-AR'),
  },
])

const canDeleteTrainer = (row: Trainer) => isManager.value && row.role !== Roles.manager

const actions: TableAction<Trainer>[] = [
  { type: 'view', href: row => `/trainers/${row.nanoId}` },
  { type: 'edit', href: row => `/trainers/${row.nanoId}/edit`, visible: isManager },
  { type: 'delete', onSelect: row => remove(row.nanoId), visible: canDeleteTrainer },
]

function onFilterUpdate({ key, value }: { key: string; value: string | number | string[] }) {
  const map: Record<string, Ref | WritableComputedRef<string | number | string[]>> = {
    search,
    role,
  }
  if (map[key]) map[key].value = value
}
</script>

<template>
  <div class="space-y-4">
    <BasePageHead :title="t('trainers.title')">
      <template #actions>
        <UButton
          v-if="isManager"
          :label="t('common.actions.add')"
          icon="i-lucide-plus"
          color="primary"
          to="/trainers/add"
        />
      </template>
    </BasePageHead>
    <BaseFilters :filters="filterConfig" :values="filterValues" @update:filters="onFilterUpdate" />
    <BaseTable
      :columns
      :actions
      :data="trainers"
      :loading
      :pagination
      :delete-label="row => row.fullName"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
