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

function isActionVisible(action: TableAction<T>, row: T): boolean {
  const v = action.visible
  if (typeof v === 'function') return v(row)
  if (v && typeof v === 'object' && 'value' in v) return toValue(v.value)
  return v ?? true
}

const CatalogDefaultActions: Record<
  ActionType,
  { label: string; icon: string; color?: ActionColor }
> = {
  view: { label: 'Ver', icon: 'i-lucide-eye' },
  edit: { label: 'Editar', icon: 'i-lucide-pencil' },
  delete: { label: 'Eliminar', icon: 'i-lucide-trash', color: 'error' },
  custom: { label: 'Acción', icon: 'i-lucide-more-horizontal' },
}

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
          const defaults = CatalogDefaultActions[action.type]
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
const showDeleteModal = ref(false)
const deleteAction = ref<((row: T) => void) | null>(null)

function openDeleteModal(row: T, onSelect: (row: T) => void) {
  deleteTarget.value = row
  deleteAction.value = onSelect
  showDeleteModal.value = true
}

function confirmDelete() {
  if (deleteTarget.value && deleteAction.value) {
    deleteAction.value(deleteTarget.value)
  }
  showDeleteModal.value = false
  deleteTarget.value = null
  deleteAction.value = null
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

    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold">Eliminar registro</h3>
          <p class="text-sm text-neutral-500">
            ¿Estás seguro que querés eliminar
            <strong v-if="deleteTarget && deleteLabel">{{ deleteLabel(deleteTarget as T) }}</strong
            >?
          </p>
          <div class="flex justify-end gap-3">
            <UButton
              class="cursor-pointer"
              label="Cancelar"
              color="neutral"
              variant="ghost"
              @click="showDeleteModal = false"
            />
            <UButton
              class="cursor-pointer"
              label="Eliminar"
              color="error"
              variant="solid"
              @click="confirmDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
