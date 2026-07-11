<script setup lang="ts">
interface AuthCardProps {
  subtitle?: string
}

defineProps<AuthCardProps>()
</script>

<template>
  <div class="bg-default border-default w-full max-w-86 rounded-lg border p-7 shadow-lg">
    <p class="font-logo text-3xl leading-none tracking-wider uppercase">
      Macros<span class="text-primary"> for Progress</span>
    </p>
    <p v-if="subtitle" class="text-muted mt-1.5 mb-5 text-sm">{{ subtitle }}</p>

    <slot />
  </div>
</template>
