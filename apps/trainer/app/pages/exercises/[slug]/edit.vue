<script setup lang="ts">
import type { UpdateExercise } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'exercises.pages.edit' })
const { t } = useI18n()
const { localizedName } = useLocalizedName()

const route = useRoute()
const { slug } = route.params

const { exercise, loading } = useGetExercise(String(slug))
const { update, pending } = useUpdateExercise()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('exercises.title'), to: '/exercises' },
  ...(exercise.value
    ? [{ label: localizedName(exercise.value), to: `/exercises/${exercise.value.slug}` }]
    : []),
  { label: t('common.actions.edit') },
])

function onSubmit(data: UpdateExercise) {
  update(String(slug), data)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('exercises.pages.edit')" />
    <ExerciseForm v-if="exercise" :exercise :loading="pending" @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
