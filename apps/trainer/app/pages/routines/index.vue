<script setup lang="ts">
import type { BaseResponse, Client, Routine } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'routines.title' })

const { routines, pagination, counts, loading, page, limit, search, clientId, status } =
  useGetRoutineList()
const { remove } = useDeleteRoutine()
const { deactivate, pending: deactivating } = useDeactivateRoutine()
const { activate, pending: activating } = useActivateRoutine()
const { t } = useI18n()

const toggleTarget = ref<Routine | null>(null)
const toggleModalOpen = ref(false)
const toggling = computed(() => deactivating.value || activating.value)
const confirmKey = computed(() =>
  toggleTarget.value?.active ? 'confirmDeactivate' : 'confirmActivate',
)

const { data: clientsData } = useFetch<BaseResponse<Client>>('/api/clients', {
  key: 'clients-select',
  query: { limit: 100 },
})
const clientOptions = computed(() =>
  (clientsData.value?.rows ?? []).map(c => ({ label: c.fullName, value: c.id })),
)

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('routines.title') },
])

const filterConfig = computed<Filter[]>(() => {
  const filters: Filter[] = [
    {
      type: 'search',
      key: 'search',
      label: t('filters.search'),
      placeholder: t('routines.search'),
      debounce: 300,
    },
    {
      type: 'select',
      key: 'status',
      label: t('routines.filters.status'),
      default: 'active',
      options: [
        { label: t('routines.filters.statusOptions.active'), value: 'active' },
        { label: t('routines.filters.statusOptions.inactive'), value: 'inactive' },
        { label: t('routines.filters.statusOptions.all'), value: 'all' },
      ],
    },
    {
      type: 'select',
      key: 'clientId',
      label: t('routines.filters.client'),
      placeholder: t('routines.filters.clientPlaceholder'),
      options: clientOptions.value,
      searchable: true,
    },
  ]
  return filters
})

const filterValues = computed(() => ({
  search: search.value,
  status: status.value,
  clientId: clientId.value,
}))

const BaseBadge = resolveComponent('BaseBadge')

const columns = computed<TableColumn<Routine>[]>(() => [
  {
    accessorKey: 'name',
    header: t('routines.columns.name'),
    cell: ({ row }) => h('span', { class: 'font-semibold text-highlighted' }, row.original.name),
  },
  {
    accessorKey: 'client',
    header: t('routines.columns.client'),
    cell: ({ row }) =>
      row.original.client
        ? row.original.client.fullName
        : h('span', { class: 'text-muted' }, t('routines.noClient')),
  },
  {
    id: 'structure',
    header: t('routines.columns.structure'),
    accessorFn: row => `${row.daysPerWeek}·${row.weeks}`,
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted text-sm' },
        t('routines.structure', { days: row.original.daysPerWeek, weeks: row.original.weeks }),
      ),
  },
  {
    accessorKey: 'active',
    header: t('routines.columns.status'),
    cell: ({ row }) =>
      row.original.active
        ? h(BaseBadge, { color: 'success', label: t('routines.status.active'), shape: 'pill' })
        : h(BaseBadge, { color: 'neutral', label: t('routines.status.inactive'), shape: 'pill' }),
  },
])

const actions = computed<TableAction<Routine>[]>(() => [
  { type: 'view', href: row => `/routines/${row.nanoId}` },
  { type: 'edit', href: row => `/routines/${row.nanoId}/edit` },
  {
    type: 'custom',
    label: t('routines.actions.deactivate'),
    icon: 'i-lucide-power',
    // BaseTable solo auto-confirma el delete; las acciones custom cablean su propio confirm.
    onSelect: openToggleModal,
    visible: row => row.active,
  },
  {
    type: 'custom',
    label: t('routines.actions.activate'),
    icon: 'i-lucide-power',
    onSelect: openToggleModal,
    visible: row => !row.active,
  },
  { type: 'delete', onSelect: row => remove(row.nanoId) },
])

function openToggleModal(row: Routine) {
  toggleTarget.value = row
  toggleModalOpen.value = true
}

async function confirmToggle() {
  const target = toggleTarget.value
  if (!target) return
  await (target.active ? deactivate(target.nanoId) : activate(target.nanoId))
  toggleModalOpen.value = false
}

function onFilterUpdate({ key, value }: { key: string; value: string | number | string[] }) {
  const map: Record<string, Ref | WritableComputedRef<string | number | string[]>> = {
    search,
    status,
    clientId,
  }
  if (map[key]) map[key].value = value
}
</script>

<template>
  <div class="space-y-4">
    <BasePageHead
      :loading
      :breadcrumbs
      :title="t('routines.title')"
      :subtitle="t('routines.count', { count: counts?.active ?? 0 })"
    >
      <template #actions>
        <UButton
          :label="t('routines.add.title')"
          icon="i-lucide-plus"
          color="primary"
          to="/routines/add"
        />
      </template>
    </BasePageHead>
    <BaseFilters :filters="filterConfig" :values="filterValues" @update:filters="onFilterUpdate" />
    <BaseTable
      :columns
      :actions
      :data="routines"
      :loading
      :pagination
      :delete-label="row => row.name"
      v-model:page="page"
      v-model:limit="limit"
    />
    <BaseConfirmModal
      v-model:open="toggleModalOpen"
      :title="t(`routines.${confirmKey}.title`)"
      :confirm-label="t(`routines.${confirmKey}.confirm`)"
      :loading="toggling"
      icon="i-lucide-power"
      @confirm="confirmToggle"
    >
      {{ t(`routines.${confirmKey}.message`, { name: toggleTarget?.name ?? '' }) }}
    </BaseConfirmModal>
  </div>
</template>
