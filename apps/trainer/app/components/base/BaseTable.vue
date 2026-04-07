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
}

interface BaseTableEmits {
  'update:page': [value: number]
  'update:limit': [value: number]
}

const { columns, actions, data, loading, pagination } = defineProps<BaseTableProps>()

const emit = defineEmits<BaseTableEmits>()

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
        .filter(a => a.visible === undefined || toValue(a.visible))
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
              action.onSelect?.(row.original)
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
  </div>
</template>
