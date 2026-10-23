<script setup lang="ts">
interface PlanNoteProps {
  label: string
  text: string
}

defineProps<PlanNoteProps>()
</script>

<template>
  <div>
    <p class="text-dimmed mb-1 text-[10px] font-semibold tracking-widest uppercase">
      {{ label }}
    </p>
    <p class="text-default text-sm whitespace-pre-line">{{ text }}</p>
  </div>
</template>
