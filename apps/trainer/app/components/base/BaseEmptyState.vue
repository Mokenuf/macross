<script setup lang="ts">
interface BaseEmptyStateProps {
  message: string
  icon?: string
}

const { message, icon = 'i-lucide-inbox' } = defineProps<BaseEmptyStateProps>()
</script>

<template>
  <div
    class="border-default flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-8 text-center"
  >
    <div class="bg-elevated text-dimmed flex size-11 items-center justify-center rounded-full">
      <UIcon :name="icon" class="size-5" />
    </div>
    <p class="text-muted text-sm">{{ message }}</p>
    <slot name="action" />
  </div>
</template>
