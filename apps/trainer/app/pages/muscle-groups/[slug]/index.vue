<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Detalle del grupo muscular' })

const route = useRoute()
const { slug } = route.params

const { muscleGroup, loading } = useGetMuscleGroup(String(slug))
const { data: user } = useGetMe()
const isManager = computed(() => user.value?.role === 'manager')
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <div v-if="muscleGroup">
      <div class="mb-6 flex items-center justify-between">
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
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
