<script setup lang="ts">
interface BasePersonProps {
  name: string
  subtitle?: string
  avatarUrl?: string | null
}

const { name, subtitle, avatarUrl } = defineProps<BasePersonProps>()

const initials = computed(() =>
  name
    .split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <div class="flex items-center gap-2.5">
    <UAvatar
      :src="avatarUrl || undefined"
      :text="initials"
      class="from-macross-primary-500 to-macross-gray-800 size-8 bg-linear-to-br"
      :ui="{ fallback: 'font-logo text-sm text-highlighted' }"
    />
    <div class="min-w-0">
      <p class="text-highlighted truncate text-sm font-semibold">{{ name }}</p>
      <slot name="subtitle">
        <p v-if="subtitle" class="text-dimmed truncate text-xs">{{ subtitle }}</p>
      </slot>
    </div>
  </div>
</template>
