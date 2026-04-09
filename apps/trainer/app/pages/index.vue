<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  title: 'Dashboard',
})

useHead({ title: 'Dashboard' })

const { data: user, pending } = useGetMe()
</script>

<template>
  <div v-if="pending" class="flex items-center gap-2 text-neutral-400">
    <UIcon name="i-lucide-loader-2" class="animate-spin" />
    Cargando...
  </div>
  <div v-else-if="user">
    <h1 class="text-2xl font-bold">Hola, {{ user.fullName }}</h1>
    <p class="text-neutral-400 mt-2">Bienvenido al panel de Macros for progress.</p>
    <UBadge :color="user.role === 'manager' ? 'error' : 'info'" class="mt-3">{{
      user.role
    }}</UBadge>
  </div>
</template>
