<script setup lang="ts">
import type { MuscleGroup } from '@macross/shared'

interface MuscleGroupDetailProps {
  muscleGroup: MuscleGroup
}

const { muscleGroup } = defineProps<MuscleGroupDetailProps>()
const { t } = useI18n()
</script>

<template>
  <div
    class="border-default bg-elevated flex items-center justify-between gap-4 rounded-lg border px-5 py-4"
  >
    <p class="text-muted text-sm">
      {{ t('muscle-groups.detail.usage', muscleGroup.exerciseCount ?? 0) }}
    </p>
    <UButton
      v-if="muscleGroup.exerciseCount"
      :label="t('muscle-groups.detail.viewExercises')"
      trailing-icon="i-lucide-arrow-right"
      color="neutral"
      variant="subtle"
      size="sm"
      :to="{ path: '/exercises', query: { muscleGroupIds: `[${muscleGroup.id}]` } }"
    />
  </div>
</template>
