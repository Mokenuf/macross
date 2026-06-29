<script setup lang="ts">
import { Roles, type BaseResponse, type Client, type Trainer } from '@macross/shared'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'clients.title' })

const { clients, pagination, loading, page, limit, search, trainerId, status } = useGetClientList()
const { remove } = useDeleteClient()
const { reactivate } = useReactivateClient()
const { data: me } = useGetMe()
const { t } = useI18n()
const { formatDate } = useFormatDate()

const { data: trainersData } = useFetch<BaseResponse<Trainer>>('/api/trainers', {
  key: 'trainers-select',
  query: { limit: 100 },
})

const isManager = computed(() => me.value?.role === Roles.manager)
const trainerOptions = computed(() =>
  (trainersData.value?.rows ?? []).map(tr => ({ label: tr.fullName, value: tr.id })),
)

const filterConfig = computed<Filter[]>(() => {
  const filters: Filter[] = [
    {
      type: 'search',
      key: 'search',
      label: t('filters.search'),
      placeholder: t('clients.search'),
      debounce: 300,
    },
    {
      type: 'select',
      key: 'status',
      label: t('clients.filters.status'),
      default: 'active',
      options: [
        { label: t('clients.filters.statusOptions.active'), value: 'active' },
        { label: t('clients.filters.statusOptions.deleted'), value: 'deleted' },
        { label: t('clients.filters.statusOptions.all'), value: 'all' },
      ],
    },
  ]
  if (isManager.value) {
    filters.push({
      type: 'select',
      key: 'trainerId',
      label: t('clients.filters.trainer'),
      placeholder: t('clients.filters.trainerPlaceholder'),
      options: trainerOptions.value,
      searchable: true,
    })
  }
  return filters
})

const filterValues = computed(() => ({
  search: search.value,
  trainerId: trainerId.value,
  status: status.value,
}))

const UBadge = resolveComponent('UBadge')

const columns = computed<TableColumn<Client>[]>(() => {
  const cols: TableColumn<Client>[] = [
    { accessorKey: 'fullName', header: t('clients.columns.name') },
    { accessorKey: 'email', header: t('clients.columns.email') },
  ]
  if (isManager.value) {
    cols.push({
      accessorKey: 'trainer',
      header: t('clients.columns.trainer'),
      cell: ({ row }) => row.original.trainer?.fullName ?? '—',
    })
  }
  cols.push({
    accessorKey: 'deletedAt',
    header: t('clients.columns.status'),
    cell: ({ row }) =>
      row.original.deletedAt
        ? h(UBadge, { color: 'error', variant: 'subtle' }, () => t('common.status.deleted'))
        : h(UBadge, { color: 'success', variant: 'subtle' }, () => t('common.status.active')),
  })
  cols.push({
    accessorKey: 'createdAt',
    header: t('clients.columns.createdAt'),
    cell: ({ row }) => formatDate(row.original.createdAt),
  })
  return cols
})

const actions = computed<TableAction<Client>[]>(() => [
  { type: 'view', href: row => `/clients/${row.nanoId}` },
  { type: 'edit', href: row => `/clients/${row.nanoId}/edit` },
  { type: 'delete', onSelect: row => remove(row.nanoId), visible: row => !row.deletedAt },
  {
    type: 'custom',
    label: t('clients.actions.reactivate'),
    icon: 'i-lucide-rotate-ccw',
    onSelect: row => reactivate(row.nanoId),
    visible: row => !!row.deletedAt,
  },
])

function onFilterUpdate({ key, value }: { key: string; value: string | number | string[] }) {
  const map: Record<string, Ref | WritableComputedRef<string | number | string[]>> = {
    search,
    trainerId,
    status,
  }
  if (map[key]) map[key].value = value
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-end justify-between">
      <BaseFilters
        :filters="filterConfig"
        :values="filterValues"
        @update:filters="onFilterUpdate"
      />
      <UButton
        :label="t('clients.add.title')"
        icon="i-lucide-plus"
        color="primary"
        to="/clients/add"
      />
    </div>
    <BaseTable
      :columns
      :actions
      :data="clients"
      :loading
      :pagination
      :delete-label="row => row.fullName"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
