<script setup lang="ts">
import type { Exercise } from '@macross/shared'

interface ExerciseDetailProps {
  exercise: Exercise
}

const { exercise } = defineProps<ExerciseDetailProps>()

const youtubeEmbedUrl = computed(() => {
  if (!exercise.videoUrl) return null
  try {
    const url = new URL(exercise.videoUrl)
    const isYoutube = url.hostname.includes('youtube.com') || url.hostname === 'youtu.be'
    if (!isYoutube) return null
    const videoId = url.searchParams.get('v') || url.pathname.split('/').pop()
    if (!videoId) return null
    return `https://www.youtube.com/embed/${videoId}`
  } catch (error) {
    return null
  }
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="exercise.muscleGroup">
      <h3 class="text-sm font-medium text-neutral-500">Grupo muscular</h3>
      <p class="mt-1">{{ exercise.muscleGroup }}</p>
    </div>

    <div v-if="exercise.description">
      <h3 class="text-sm font-medium text-neutral-500">Descripción</h3>
      <p class="mt-1 whitespace-pre-line">{{ exercise.description }}</p>
    </div>

    <div v-if="youtubeEmbedUrl">
      <h3 class="text-sm font-medium text-neutral-500 mb-2">Video</h3>
      <iframe
        :src="youtubeEmbedUrl"
        class="w-full aspect-video rounded-lg"
        frameborder="0"
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
        "
        allowfullscreen
      />
    </div>
  </div>
</template>
