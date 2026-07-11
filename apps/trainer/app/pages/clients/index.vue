<script setup lang="ts">
import { Roles, type BaseResponse, type Client, type Trainer } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'clients.title' })

const {
  clients,
  pagination,
  counts,
  loading,
  page,
  limit,
  search,
  trainerId,
  status,
  level,
  goal,
} = useGetClientList()
const { remove } = useDeleteClient()
const { reactivate } = useReactivateClient()
const { data: me } = useGetMe()
const { t } = useI18n()
const { formatDate } = useFormatDate()
const { levelLabels, goalLabels, levelOptions, goalOptions } = useClientOptions()

const { data: trainersData } = useFetch<BaseResponse<Trainer>>('/api/trainers', {
  key: 'trainers-select',
  query: { limit: 100 },
})

const isManager = computed(() => me.value?.role === Roles.manager)
const trainerOptions = computed(() =>
  (trainersData.value?.rows ?? []).map(tr => ({ label: tr.fullName, value: tr.id })),
)

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('clients.title') },
])

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
    {
      type: 'select',
      key: 'level',
      label: t('clients.filters.level'),
      placeholder: t('clients.filters.levelPlaceholder'),
      options: levelOptions.value,
    },
    {
      type: 'select',
      key: 'goal',
      label: t('clients.filters.goals'),
      placeholder: t('clients.filters.goalsPlaceholder'),
      options: goalOptions.value,
      multiple: true,
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
  level: level.value,
  goal: goal.value,
}))

const BaseBadge = resolveComponent('BaseBadge')
const BaseBadgeList = resolveComponent('BaseBadgeList')
const BasePerson = resolveComponent('BasePerson')

const columns = computed<TableColumn<Client>[]>(() => {
  const cols: TableColumn<Client>[] = [
    {
      accessorKey: 'fullName',
      header: t('clients.columns.person'),
      cell: ({ row }) =>
        h(BasePerson, {
          name: row.original.fullName,
          subtitle: row.original.email,
          avatarUrl: row.original.avatarUrl,
        }),
    },
    {
      accessorKey: 'level',
      header: t('clients.columns.level'),
      cell: ({ row }) => {
        const rowLevel = row.original.level
        return rowLevel
          ? h(BaseBadge, { color: 'neutral', label: levelLabels.value[rowLevel] })
          : h('span', { class: 'text-muted' }, '—')
      },
    },
    {
      accessorKey: 'goal',
      header: t('clients.columns.goals'),
      cell: ({ row }) =>
        h(BaseBadgeList, {
          items: (row.original.goal ?? []).map(g => goalLabels.value[g]),
          color: 'primary',
        }),
    },
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
        ? h(BaseBadge, { color: 'error', label: t('common.status.deleted'), shape: 'pill' })
        : h(BaseBadge, { color: 'success', label: t('common.status.active'), shape: 'pill' }),
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
    level,
    goal,
  }
  if (map[key]) map[key].value = value
}
</script>

<template>
  <div class="space-y-4">
    <BasePageHead
      :loading
      :breadcrumbs
      :title="t('clients.title')"
      :subtitle="t('clients.count', { active: counts?.active ?? 0, total: counts?.total ?? 0 })"
    >
      <template #actions>
        <UButton
          :label="t('clients.add.title')"
          icon="i-lucide-plus"
          color="primary"
          to="/clients/add"
        />
      </template>
    </BasePageHead>
    <BaseFilters :filters="filterConfig" :values="filterValues" @update:filters="onFilterUpdate" />
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
