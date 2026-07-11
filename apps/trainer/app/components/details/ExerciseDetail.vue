<script setup lang="ts">
import type { Exercise } from '@macross/shared'

const { exercise } = defineProps<{ exercise: Exercise }>()
const { t } = useI18n()
const { localizedName } = useLocalizedName()

const muscleGroupNames = computed(() => exercise.muscleGroups?.map(mg => localizedName(mg)) ?? [])

const descriptions = computed(() =>
  [
    { label: t('exercises.detail.descriptionEs'), text: exercise.descriptionEs },
    { label: t('exercises.detail.descriptionEn'), text: exercise.descriptionEn },
  ].filter(d => d.text),
)

const youtubeEmbedUrl = computed(() => {
  if (!exercise.videoUrl) return null
  try {
    const url = new URL(exercise.videoUrl)
    const isYoutube = url.hostname.includes('youtube.com') || url.hostname === 'youtu.be'
    if (!isYoutube) return null
    const videoId = url.searchParams.get('v') || url.pathname.split('/').pop()
    if (!videoId) return null
    return `https://www.youtube.com/embed/${videoId}`
  } catch {
    return null
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-5 md:grid-cols-[1.5fr_1fr]">
      <iframe
        v-if="youtubeEmbedUrl"
        :src="youtubeEmbedUrl"
        class="border-default aspect-video w-full rounded-lg border"
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
      <div
        v-else
        class="border-default bg-elevated text-dimmed flex aspect-video items-center justify-center rounded-lg border"
      >
        <UIcon name="i-lucide-video-off" class="size-8" />
      </div>

      <div class="space-y-5">
        <div v-if="muscleGroupNames.length">
          <p class="text-dimmed mb-3 text-[11px] font-semibold tracking-widest uppercase">
            {{ t('exercises.detail.muscleGroups') }}
          </p>
          <BaseBadgeList :items="muscleGroupNames" color="primary" :max="99" />
        </div>
        <div v-if="exercise.equipment">
          <p class="text-dimmed mb-3 text-[11px] font-semibold tracking-widest uppercase">
            {{ t('exercises.detail.equipment') }}
          </p>
          <BaseBadgeList :items="[localizedName(exercise.equipment)]" color="neutral" :max="99" />
        </div>
      </div>
    </div>

    <div v-if="descriptions.length" class="space-y-4">
      <div v-for="d in descriptions" :key="d.label">
        <p class="text-dimmed mb-2 text-[11px] font-semibold tracking-widest uppercase">
          {{ d.label }}
        </p>
        <p class="text-muted text-sm leading-relaxed whitespace-pre-line">{{ d.text }}</p>
      </div>
    </div>
  </div>
</template>
