<script setup lang="ts">
import type { Equipment } from '@macross/shared'

interface EquipmentDetailProps {
  equipment: Equipment
}

const { equipment } = defineProps<EquipmentDetailProps>()
const { t } = useI18n()
</script>

<template>
  <div
    class="border-default bg-elevated flex items-center justify-between gap-4 rounded-lg border px-5 py-4"
  >
    <p class="text-muted text-sm">
      {{ t('equipment.detail.usage', equipment.exerciseCount ?? 0) }}
    </p>
    <UButton
      v-if="equipment.exerciseCount"
      :label="t('equipment.detail.viewExercises')"
      trailing-icon="i-lucide-arrow-right"
      color="neutral"
      variant="subtle"
      size="sm"
      :to="{ path: '/exercises', query: { equipmentIds: `[${equipment.id}]` } }"
    />
  </div>
</template>
