import {
  defaultPagination,
  type ApiError,
  type BaseResponse,
  type CreateExercise,
  type Exercise,
  type ExerciseFilters,
  type Pagination,
  type UpdateExercise,
} from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useGetExercises() {
  const filters = useQueryFilters<ExerciseFilters>({
    page: 1,
    limit: 20,
    search: '',
    sort: 'createdAt',
    order: 'desc',
  })

  const { data, pending, refresh, error } = useFetch<BaseResponse<Exercise>>('/api/exercises', {
    key: 'exercises',
    query: filters,
  })

  const exercises = computed<Exercise[]>(() => data.value?.rows ?? [])
  const pagination = computed<Pagination>(() => data.value?.pagination ?? defaultPagination)

  return {
    exercises,
    pagination,
    loading: pending,
    refresh,
    error,
    ...filters,
  }
}

export function useGetExercise(slug: string) {
  const { data, pending, refresh, error } = useFetch<Exercise>(`/api/exercises/${slug}`, {
    key: `exercise-${slug}`,
  })

  return { exercise: data, loading: pending, refresh, error }
}

export function useCreateExercise() {
  const pending = ref(false)
  const toast = useToast()

  async function create(input: CreateExercise) {
    pending.value = true
    try {
      await $fetch('/api/exercises', { method: 'POST', body: input })
      await refreshNuxtData('exercises')
      await navigateTo('/exercises')
      toast.add({ title: 'Ejercicio creado', color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? 'No se pudo crear el ejercicio',
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { create, pending }
}

export function useUpdateExercise() {
  const pending = ref(false)
  const toast = useToast()

  async function update(slug: string, input: UpdateExercise) {
    pending.value = true
    try {
      await $fetch(`/api/exercises/${slug}`, { method: 'PATCH', body: input })
      await refreshNuxtData('exercises')
      await navigateTo('/exercises')
      toast.add({ title: 'Ejercicio actualizado', color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? 'No se pudo actualizar el ejercicio',
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { update, pending }
}

export function useDeleteExercise() {
  const pending = ref(false)
  const toast = useToast()

  async function remove(slug: string) {
    pending.value = true
    try {
      await $fetch(`/api/exercises/${slug}`, { method: 'DELETE' })
      await refreshNuxtData('exercises')
      toast.add({ title: 'Ejercicio eliminado', color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? 'No se pudo eliminar el ejercicio',
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { remove, pending }
}
