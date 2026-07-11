<script setup lang="ts">
interface BaseKPIProps {
  label: string
  value: string | number
  unit?: string
  color?: 'default' | 'primary' | 'warning'
}

const { color = 'default' } = defineProps<BaseKPIProps>()

const valueClass: Record<NonNullable<BaseKPIProps['color']>, string> = {
  default: 'text-highlighted',
  primary: 'text-primary',
  warning: 'text-warning',
}
</script>

<template>
  <div class="bg-elevated border-default rounded-md border p-4">
    <p class="text-dimmed text-[10.5px] font-semibold tracking-widest uppercase">{{ label }}</p>
    <p class="font-logo mt-2 text-[2.75rem] leading-none tabular-nums" :class="valueClass[color]">
      {{ value }}
    </p>
    <p v-if="unit" class="text-dimmed mt-1 text-xs">{{ unit }}</p>
  </div>
</template>
