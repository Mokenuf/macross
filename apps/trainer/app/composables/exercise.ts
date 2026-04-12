import type {
  ApiError,
  BaseResponse,
  CreateExercise,
  Exercise,
  ExerciseSortOptions,
  OrderOptions,
  Pagination,
  UpdateExercise,
} from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useGetExercises() {
  const page = useQueryState('page', 1)
  const limit = useQueryState('limit', 20)
  const search = useQueryState('search', '')
  const sort = useQueryState<ExerciseSortOptions>('sort', 'createdAt')
  const order = useQueryState<OrderOptions>('order', 'desc')

  const { data, pending, refresh, error } = useFetch<BaseResponse<Exercise>>('/api/exercises', {
    key: 'exercises',
    query: { page, limit, search, sort, order },
  })

  const exercises = computed<Exercise[]>(() => data.value?.rows ?? [])
  const pagination = computed<Pagination>(
    () => data.value?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
  )

  return {
    exercises,
    pagination,
    loading: pending,
    refresh,
    error,
    page,
    limit,
    search,
    sort,
    order,
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
