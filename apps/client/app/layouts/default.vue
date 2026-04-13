<script setup lang="ts">
const { logout } = useLogout()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <header class="flex items-center justify-between border-b border-default p-4">
      <h1 class="text-lg font-semibold">Macross</h1>
      <UButton icon="i-lucide-log-out" color="neutral" variant="ghost" @click="logout" />
    </header>
    <main class="flex-1 p-4">
      <slot />
    </main>
  </div>
</template>
