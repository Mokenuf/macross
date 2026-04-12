import type {
  Pagination,
  BaseResponse,
  MuscleGroup,
  MuscleGroupSortOptions,
  OrderOptions,
  CreateMuscleGroup,
  ApiError,
  UpdateMuscleGroup,
} from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useGetMuscleGroups() {
  const page = useQueryState('page', 1)
  const limit = useQueryState('limit', 20)
  const search = useQueryState('search', '')
  const sort = useQueryState<MuscleGroupSortOptions>('sort', 'createdAt')
  const order = useQueryState<OrderOptions>('order', 'desc')

  const { data, pending, refresh, error } = useFetch<BaseResponse<MuscleGroup>>(
    '/api/muscle-groups',
    {
      key: 'muscle-groups',
      query: { page, limit, search, sort, order },
    },
  )

  const muscleGroups = computed<MuscleGroup[]>(() => data.value?.rows ?? [])
  const pagination = computed<Pagination>(
    () => data.value?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
  )

  return {
    muscleGroups,
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

export function useGetMuscleGroup(slug: string) {
  const { data, pending, refresh, error } = useFetch<MuscleGroup>(`/api/muscle-groups/${slug}`, {
    key: `muscle-group-${slug}`,
  })

  return { muscleGroup: data, loading: pending, refresh, error }
}

export function useCreateMuscleGroup() {
  const toast = useToast()

  async function create(input: CreateMuscleGroup) {
    try {
      await $fetch('/api/muscle-groups', { method: 'POST', body: input })
      await refreshNuxtData('muscle-groups')
      await navigateTo('/muscle-groups')
      toast.add({ title: 'Grupo muscular creado', color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? 'No se pudo crear el grupo muscular',
        color: 'error',
      })
    }
  }

  return { create }
}

export function useUpdateMuscleGroup() {
  const toast = useToast()

  async function update(slug: string, input: UpdateMuscleGroup) {
    try {
      await $fetch(`/api/muscle-groups/${slug}`, { method: 'PATCH', body: input })
      await refreshNuxtData('muscle-groups')
      await navigateTo('/muscle-groups')
      toast.add({ title: 'Grupo muscular actualizado', color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ??
          'No se pudo actualizar el grupo muscular',
        color: 'error',
      })
    }
  }
  return { update }
}

export function useDeleteMuscleGroup() {
  const toast = useToast()

  async function remove(slug: string) {
    try {
      await $fetch(`/api/muscle-groups/${slug}`, { method: 'DELETE' })
      await refreshNuxtData('muscle-groups')
      toast.add({ title: 'Grupo muscular eliminado', color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ??
          'No se pudo eliminar el grupo muscular',
        color: 'error',
      })
    }
  }
  return { remove }
}
