<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useHead({ title: 'Inicio' })

const user = useSupabaseUser()
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">Hola👋</h1>
    <p class="text-neutral-400">{{ user?.email }}</p>
    <UCard>
      <template #header>
        <h3 class="font-semibold">Tu rutina</h3>
      </template>
      <p class="text-sm text-neutral-400">Próximamente vas a ver tu rutina del día acá</p>
    </UCard>
  </div>
</template>
