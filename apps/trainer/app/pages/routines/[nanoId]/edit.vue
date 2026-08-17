<script setup lang="ts">
import type { UpdateRoutine } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'routines.edit.title' })

const { t } = useI18n()
const route = useRoute()
const nanoId = String(route.params.nanoId)

const { routine, loading } = useGetRoutine(nanoId)
const { update, pending } = useUpdateRoutine()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('routines.title'), to: '/routines' },
  ...(routine.value
    ? [{ label: routine.value.name, to: `/routines/${routine.value.nanoId}` }]
    : []),
  { label: t('common.actions.edit') },
])

function onSubmit(data: UpdateRoutine) {
  update(nanoId, data)
}
</script>

<template>
  <div>
    <div v-if="routine">
      <BasePageHead :title="t('routines.edit.title')" :breadcrumbs />
      <RoutineWizard :routine :loading="pending" @submit="onSubmit" />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
