<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Detalle ejercicio' })

const route = useRoute()
const { slug } = route.params

const { exercise, loading } = useGetExercise(String(slug))
const { data: user } = useGetMe()
const isManager = computed(() => user.value?.role === 'manager')
</script>

<template>
  <div class="w-full max-w-2xl mx-auto py-6">
    <div v-if="exercise">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">{{ exercise.name }}</h1>
        <UButton
          v-if="isManager"
          icon="i-lucide-pencil"
          label="Editar"
          :to="`/exercises/${exercise.slug}/edit`"
        />
      </div>
      <ExerciseDetail :exercise />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
    </div>
  </div>
</template>
