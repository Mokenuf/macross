<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  title: 'Dashboard',
})

useHead({ title: 'Dashboard' })

const user = useSupabaseUser()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">Hola, {{ user?.email }}</h1>
    <p class="text-gray-500 mt-2">Bienvenido al panel de Macross for progress.</p>
  </div>
</template>
