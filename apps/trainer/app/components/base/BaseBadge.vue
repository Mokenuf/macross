<script setup lang="ts">
interface BaseBadgeProps {
  label: string
  color?: 'primary' | 'info' | 'success' | 'warning' | 'error' | 'neutral'
  shape?: 'tag' | 'pill'
}

const { label, color = 'neutral', shape = 'tag' } = defineProps<BaseBadgeProps>()
</script>

<template>
  <UBadge
    :color
    :label
    variant="subtle"
    :class="shape === 'pill' ? 'gap-1.5 rounded-full' : undefined"
  >
    <template v-if="shape === 'pill'" #leading>
      <span class="size-1.5 rounded-full bg-current" />
    </template>
  </UBadge>
</template>
