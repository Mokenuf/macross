<script setup lang="ts">
interface BasePersonHeroProps {
  name: string
  avatarUrl?: string | null
}

const { name, avatarUrl } = defineProps<BasePersonHeroProps>()

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
  <div class="bg-elevated border-default flex items-center gap-4 rounded-md border p-4.5">
    <UAvatar
      :src="avatarUrl || undefined"
      :text="initials"
      class="from-macross-primary-500 to-macross-gray-800 size-15 bg-linear-to-br"
      :ui="{ fallback: 'font-logo text-2xl text-highlighted' }"
    />
    <div class="min-w-0">
      <p class="font-logo text-highlighted truncate text-3xl leading-none tracking-wide">
        {{ name }}
      </p>
      <div v-if="$slots.subtitle" class="text-dimmed mt-1.5 text-xs">
        <slot name="subtitle" />
      </div>
      <div v-if="$slots.pills" class="mt-2.5 flex flex-wrap items-center gap-1.5">
        <slot name="pills" />
      </div>
    </div>
  </div>
</template>
