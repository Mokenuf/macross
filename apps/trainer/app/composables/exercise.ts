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
  const toast = useToast()

  async function create(input: CreateExercise) {
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
    }
  }

  return { create }
}

export function useUpdateExercise() {
  const toast = useToast()

  async function update(slug: string, input: UpdateExercise) {
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
    }
  }

  return { update }
}

export function useDeleteExercise() {
  const toast = useToast()

  async function remove(slug: string) {
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
    }
  }

  return { remove }
}
