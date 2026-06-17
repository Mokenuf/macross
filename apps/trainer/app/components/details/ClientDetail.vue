<script setup lang="ts">
import type { Client } from '@macross/shared'

interface ClientDetailProps {
  client: Client
}

const { client } = defineProps<ClientDetailProps>()
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <UAvatar :src="client.avatarUrl ?? undefined" :alt="client.fullName" size="xl" />
      <p class="text-lg font-medium">{{ client.fullName }}</p>
    </div>

    <div>
      <h3 class="text-sm font-medium text-neutral-500">Email</h3>
      <p class="mt-1">{{ client.email }}</p>
    </div>

    <div v-if="client.phone">
      <h3 class="text-sm font-medium text-neutral-500">Teléfono</h3>
      <p class="mt-1">{{ client.phone }}</p>
    </div>

    <div v-if="client.trainer">
      <h3 class="text-sm font-medium text-neutral-500">Entrenador</h3>
      <ULink :to="`/trainers/${client.trainer.nanoId}`" class="text-primary mt-1 inline-block">
        {{ client.trainer.fullName }}
      </ULink>
    </div>
  </div>
</template>
