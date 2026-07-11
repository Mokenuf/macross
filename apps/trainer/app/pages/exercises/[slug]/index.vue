<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'exercises.pages.detail' })
const { t, locale } = useI18n()
const { localizedName } = useLocalizedName()

const route = useRoute()
const { slug } = route.params

const { exercise, loading } = useGetExercise(String(slug))
const { remove, pending } = useDeleteExercise()
const { data: user } = useGetMe()
const isManager = computed(() => user.value?.role === 'manager')

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('exercises.title'), to: '/exercises' },
  ...(exercise.value ? [{ label: localizedName(exercise.value) }] : []),
])

const otherName = computed(() => {
  if (!exercise.value) return undefined
  return locale.value === 'en' ? exercise.value.nameEs : (exercise.value.nameEn ?? undefined)
})

const showDeleteModal = ref(false)

function openDeleteModal() {
  showDeleteModal.value = true
}

async function confirmDelete() {
  await remove(String(slug))
  await navigateTo('/exercises')
}
</script>

<template>
  <div>
    <div v-if="exercise">
      <BasePageHead :title="localizedName(exercise)" :breadcrumbs :subtitle="otherName">
        <template v-if="isManager" #actions>
          <div class="flex gap-2">
            <UButton
              :label="t('common.actions.edit')"
              color="neutral"
              variant="outline"
              size="sm"
              :to="`/exercises/${exercise.slug}/edit`"
            />
            <UButton
              :label="t('common.actions.delete')"
              color="error"
              variant="outline"
              size="sm"
              @click="openDeleteModal"
            />
          </div>
        </template>
      </BasePageHead>
      <ExerciseDetail :exercise />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>

    <BaseConfirmModal v-model:open="showDeleteModal" :loading="pending" @confirm="confirmDelete">
      <i18n-t keypath="common.confirmDelete.message" tag="span" scope="global">
        <template #name>
          <strong>{{ exercise ? localizedName(exercise) : '' }}</strong>
        </template>
      </i18n-t>
    </BaseConfirmModal>
  </div>
</template>
