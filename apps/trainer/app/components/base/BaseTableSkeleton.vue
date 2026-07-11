<script setup lang="ts" generic="T">
import type { TableColumn } from '@/types/base-table'

interface BaseTableSkeletonProps<T> {
  columns: TableColumn<T>[]
  rows?: number
}

const { columns, rows = 6 } = defineProps<BaseTableSkeletonProps<T>>()

const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-4/5', 'w-3/5']
</script>

<template>
  <table class="w-full">
    <thead>
      <tr>
        <th
          v-for="(col, i) in columns"
          :key="i"
          class="text-dimmed border-muted border-b px-3 pb-2.5 text-left text-[10.5px] font-semibold tracking-[.1em] uppercase"
        >
          {{ typeof col.header === 'string' ? col.header : '' }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r">
        <td v-for="(col, i) in columns" :key="i" class="border-muted border-b px-3 py-3.5">
          <USkeleton v-if="col.id === 'actions'" class="ml-auto size-4 rounded" />
          <USkeleton v-else class="h-4" :class="widths[i % widths.length]" />
        </td>
      </tr>
    </tbody>
  </table>
</template>
