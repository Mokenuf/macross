<script setup lang="ts">
import type { CreateTrainer, UpdateTrainer } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'trainers.edit.title' })

const { t } = useI18n()
const route = useRoute()
const { nanoId } = route.params

const { trainer, loading } = useGetTrainer(String(nanoId))
const { update, pending } = useUpdateTrainer()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('trainers.title'), to: '/trainers' },
  ...(trainer.value
    ? [{ label: trainer.value.fullName, to: `/trainers/${trainer.value.nanoId}` }]
    : []),
  { label: t('common.actions.edit') },
])

function onSubmit(data: CreateTrainer | UpdateTrainer) {
  update(String(nanoId), data as UpdateTrainer)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('trainers.edit.heading')" />
    <TrainerForm v-if="trainer" :trainer :loading="pending" @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
