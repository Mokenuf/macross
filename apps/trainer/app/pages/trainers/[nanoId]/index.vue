<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Detalle del entrenador' })

const route = useRoute()
const { nanoId } = route.params

const { trainer, loading } = useGetTrainer(String(nanoId))
const { data: user } = useGetMe()
const isManager = computed(() => user.value?.role === 'manager')
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <div v-if="trainer">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">{{ trainer.fullName }}</h1>
        <UButton
          v-if="isManager"
          icon="i-lucide-pencil"
          label="Editar"
          :to="`/trainers/${trainer.nanoId}/edit`"
        />
      </div>
      <TrainerDetail :trainer />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
