<script setup lang="ts">
import { Roles, type Trainer } from '@macross/shared'

interface TrainerDetailProps {
  trainer: Trainer
  isManager?: boolean
}

const { trainer, isManager = false } = defineProps<TrainerDetailProps>()

const roleLabel = computed(() => (trainer.role === Roles.trainer ? 'Entrenador' : 'Manager'))
const roleColor = computed(() => (trainer.role === Roles.trainer ? 'primary' : 'neutral'))
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <UAvatar :src="trainer.avatarUrl ?? undefined" :alt="trainer.fullName" size="xl" />
      <div>
        <p class="text-lg font-medium">{{ trainer.fullName }}</p>
        <UBadge :label="roleLabel" :color="roleColor" variant="subtle" />
      </div>
    </div>

    <div>
      <h3 class="text-sm font-medium text-neutral-500">Email</h3>
      <p class="mt-1">{{ trainer.email }}</p>
    </div>

    <div v-if="trainer.phone">
      <h3 class="text-sm font-medium text-neutral-500">Teléfono</h3>
      <p class="mt-1">{{ trainer.phone }}</p>
    </div>

    <div v-if="isManager">
      <h3 class="text-sm font-medium text-neutral-500">Clientes</h3>
      <div class="mt-1 flex items-center gap-3">
        <p>{{ trainer.totalClients ?? 0 }}</p>
        <UButton
          v-if="trainer.totalClients"
          label="Ver clientes"
          icon="i-lucide-users"
          variant="subtle"
          size="xs"
          :to="`/clients?trainerId=${trainer.id}`"
        />
      </div>
    </div>
  </div>
</template>
