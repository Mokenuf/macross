<script setup lang="ts">
import type { UpdateMuscleGroup } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Editar Grupo Muscular' })

const route = useRoute()
const { slug } = route.params

const { muscleGroup, loading } = useGetMuscleGroup(String(slug))
const { update } = useUpdateMuscleGroup()

function onSubmit(data: UpdateMuscleGroup) {
  update(String(slug), data)
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto py-6">
    <h1 class="text-2xl font-bold mb-6">Editar Grupo Muscular</h1>
    <MuscleGroupForm v-if="muscleGroup" :muscle-group @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
    </div>
  </div>
</template>
