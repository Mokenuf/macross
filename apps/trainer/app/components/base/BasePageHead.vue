<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
interface BaseHeadProps {
  title: string
  subtitle?: string
  loading?: boolean
  breadcrumbs?: BreadcrumbItem[]
}

const { loading = false } = defineProps<BaseHeadProps>()
</script>

<template>
  <UBreadcrumb v-if="breadcrumbs?.length" :items="breadcrumbs" class="mb-2" />
  <div class="mb-4.5 flex items-center">
    <h3 class="font-logo text-2xl leading-none tracking-wider uppercase">{{ title }}</h3>
    <span v-if="subtitle && !loading" class="text-dimmed ml-3 text-sm">{{ subtitle }}</span>
    <div v-if="$slots.actions" class="ml-auto">
      <slot name="actions" />
    </div>
  </div>
</template>
