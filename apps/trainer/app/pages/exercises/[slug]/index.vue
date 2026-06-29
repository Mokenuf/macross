<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth', title: 'exercises.pages.detail' })
const { t } = useI18n()

const route = useRoute()
const { slug } = route.params

const { exercise, loading } = useGetExercise(String(slug))
const { data: user } = useGetMe()
const isManager = computed(() => user.value?.role === 'manager')
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <div v-if="exercise">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">{{ exercise.name }}</h1>
        <UButton
          v-if="isManager"
          icon="i-lucide-pencil"
          :label="t('common.actions.edit')"
          :to="`/exercises/${exercise.slug}/edit`"
        />
      </div>
      <ExerciseDetail :exercise />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
