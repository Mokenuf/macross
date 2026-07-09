<script setup lang="ts" generic="T">
import type { Pagination } from '@macross/shared'
import type { DropdownMenuItem } from '@nuxt/ui'

import type { ActionColor, ActionType, TableAction, TableColumn } from '@/types/base-table'

interface BaseTableProps {
  columns: TableColumn<T>[]
  actions: TableAction<T>[]
  data: T[]
  loading: boolean
  pagination: Pagination
  deleteLabel?: (row: T) => string
}

interface BaseTableEmits {
  'update:page': [value: number]
  'update:limit': [value: number]
}

const { columns, actions, data, loading, pagination, deleteLabel } = defineProps<BaseTableProps>()

const emit = defineEmits<BaseTableEmits>()

const { t } = useI18n()

function isActionVisible(action: TableAction<T>, row: T): boolean {
  const v = action.visible
  if (typeof v === 'function') return v(row)
  if (v && typeof v === 'object' && 'value' in v) return toValue(v.value)
  return v ?? true
}

const catalogDefaultActions = computed<
  Record<ActionType, { label: string; icon: string; color?: ActionColor }>
>(() => ({
  view: { label: t('common.actions.view'), icon: 'i-lucide-eye' },
  edit: { label: t('common.actions.edit'), icon: 'i-lucide-pencil' },
  delete: { label: t('common.actions.delete'), icon: 'i-lucide-trash', color: 'error' },
  custom: { label: t('common.actions.more'), icon: 'i-lucide-more-horizontal' },
}))

const allColumns = computed(() => {
  if (actions.length === 0) return columns

  const actionsColumn: TableColumn<T> = {
    id: 'actions',
    header: '',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const items: DropdownMenuItem[] = actions
        .filter(a => isActionVisible(a, row.original))
        .map(action => {
          const defaults = catalogDefaultActions.value[action.type]
          return {
            label: action.label ?? defaults.label,
            icon: action.icon ?? defaults.icon,
            color: action.color ?? defaults.color,
            ui: { item: 'cursor-pointer' },
            disabled:
              typeof action.disabled === 'function'
                ? action.disabled(row.original)
                : action.disabled,
            onSelect: () => {
              if (action.href) {
                const url =
                  typeof action.href === 'function' ? action.href(row.original) : action.href
                navigateTo(url)
              }
              if (action.type === 'delete' && action.onSelect) {
                openDeleteModal(row.original, action.onSelect)
              } else {
                action.onSelect?.(row.original)
              }
            },
          }
        })

      if (items.length === 0) return null

      const UDropdownMenu = resolveComponent('UDropdownMenu')
      const UButton = resolveComponent('UButton')

      return h(
        UDropdownMenu,
        {
          content: { align: 'end' },
          items: [items],
        },
        () =>
          h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            ui: { base: 'cursor-pointer' },
          }),
      )
    },
  }

  return [...columns, actionsColumn]
})

const deleteTarget = ref<T | null>(null)
const deleting = ref(false)
const showDeleteModal = ref(false)
const deleteAction = ref<((row: T) => void | Promise<void>) | null>(null)

function openDeleteModal(row: T, onSelect: (row: T) => void | Promise<void>) {
  deleteTarget.value = row
  deleteAction.value = onSelect
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
}

async function confirmDelete() {
  if (!deleteTarget.value || !deleteAction.value) return
  deleting.value = true
  try {
    await deleteAction.value(deleteTarget.value)
  } finally {
    deleting.value = false
    showDeleteModal.value = false
    deleteTarget.value = null
    deleteAction.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <UTable :columns="allColumns" :data :loading />

    <BasePagination
      :page="pagination.page"
      :limit="pagination.limit"
      :total="pagination.total"
      @update:page="emit('update:page', $event)"
      @update:limit="emit('update:limit', $event)"
    />

    <UModal v-model:open="showDeleteModal" :dismissible="!deleting">
      <template #content>
        <div class="space-y-4 p-6">
          <h3 class="text-lg font-semibold">{{ t('common.confirmDelete.title') }}</h3>
          <i18n-t
            keypath="common.confirmDelete.message"
            tag="p"
            class="text-sm text-neutral-500"
            scope="global"
          >
            <template #name>
              <strong>{{
                deleteTarget && deleteLabel ? deleteLabel(deleteTarget as T) : ''
              }}</strong>
            </template>
          </i18n-t>
          <div class="flex justify-end gap-3">
            <UButton
              class="cursor-pointer"
              :label="t('common.actions.cancel')"
              color="neutral"
              variant="ghost"
              :disabled="deleting"
              @click="closeDeleteModal"
            />
            <UButton
              class="cursor-pointer"
              :label="t('common.actions.delete')"
              color="error"
              variant="solid"
              :loading="deleting"
              @click="confirmDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
