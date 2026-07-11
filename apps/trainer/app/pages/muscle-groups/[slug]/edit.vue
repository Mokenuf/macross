<script setup lang="ts">
import type { UpdateMuscleGroup } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'muscle-groups.pages.edit' })

const { t } = useI18n()
const { localizedName } = useLocalizedName()
const route = useRoute()
const { slug } = route.params

const { muscleGroup, loading } = useGetMuscleGroup(String(slug))
const { update, pending } = useUpdateMuscleGroup()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('muscle-groups.title'), to: '/muscle-groups' },
  ...(muscleGroup.value
    ? [{ label: localizedName(muscleGroup.value), to: `/muscle-groups/${muscleGroup.value.slug}` }]
    : []),
  { label: t('common.actions.edit') },
])

function onSubmit(data: UpdateMuscleGroup) {
  update(String(slug), data)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('muscle-groups.pages.edit')" />
    <MuscleGroupForm
      v-if="muscleGroup"
      :muscle-group="muscleGroup"
      :loading="pending"
      @submit="onSubmit"
    />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
