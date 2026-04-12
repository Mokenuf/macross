<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Detalle Grupo Muscular' })

const route = useRoute()
const { slug } = route.params

const { muscleGroup, loading } = useGetMuscleGroup(String(slug))
const { data: user } = useGetMe()
const isManager = computed(() => user.value?.role === 'manager')
</script>

<template>
  <div class="w-full max-w-2xl mx-auto py-6">
    <div v-if="muscleGroup">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">{{ muscleGroup.name }}</h1>
        <UButton
          v-if="isManager"
          icon="i-lucide-pencil"
          label="Editar"
          :to="`/muscle-groups/${muscleGroup.slug}/edit`"
        />
      </div>
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
    </div>
  </div>
</template>
