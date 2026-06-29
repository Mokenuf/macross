import {
  defaultPagination,
  type ApiError,
  type BaseResponse,
  type CreateMuscleGroup,
  type MuscleGroup,
  type MuscleGroupFilters,
  type Pagination,
  type UpdateMuscleGroup,
} from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useGetMuscleGroupList() {
  const filters = useQueryFilters<MuscleGroupFilters>({
    page: 1,
    limit: 20,
    search: '',
    sort: 'createdAt',
    order: 'desc',
  })

  const { data, pending, refresh, error } = useFetch<BaseResponse<MuscleGroup>>(
    '/api/muscle-groups',
    {
      key: 'muscle-groups',
      query: filters,
    },
  )

  const muscleGroups = computed<MuscleGroup[]>(() => data.value?.rows ?? [])
  const pagination = computed<Pagination>(() => data.value?.pagination ?? defaultPagination)

  return {
    muscleGroups,
    pagination,
    loading: pending,
    refresh,
    error,
    ...filters,
  }
}

export function useGetMuscleGroup(slug: string) {
  const { data, pending, refresh, error } = useFetch<MuscleGroup>(`/api/muscle-groups/${slug}`, {
    key: `muscle-group-${slug}`,
  })

  return { muscleGroup: data, loading: pending, refresh, error }
}

export function useCreateMuscleGroup() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function create(input: CreateMuscleGroup) {
    pending.value = true
    try {
      await $fetch('/api/muscle-groups', { method: 'POST', body: input })
      await refreshNuxtData('muscle-groups')
      await navigateTo('/muscle-groups')
      toast.add({ title: t('muscle-groups.toasts.created'), color: 'success' })
    } catch (e) {
      toast.add({
        title: t('common.toasts.error'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('muscle-groups.toasts.createError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { create, pending }
}

export function useUpdateMuscleGroup() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function update(slug: string, input: UpdateMuscleGroup) {
    pending.value = true
    try {
      await $fetch(`/api/muscle-groups/${slug}`, { method: 'PATCH', body: input })
      await refreshNuxtData('muscle-groups')
      await navigateTo('/muscle-groups')
      toast.add({ title: t('muscle-groups.toasts.updated'), color: 'success' })
    } catch (e) {
      toast.add({
        title: t('common.toasts.error'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('muscle-groups.toasts.updateError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }
  return { update, pending }
}

export function useDeleteMuscleGroup() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function remove(slug: string) {
    pending.value = true
    try {
      await $fetch(`/api/muscle-groups/${slug}`, { method: 'DELETE' })
      await refreshNuxtData('muscle-groups')
      toast.add({ title: t('muscle-groups.toasts.deleted'), color: 'success' })
    } catch (e) {
      toast.add({
        title: t('common.toasts.error'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('muscle-groups.toasts.deleteError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }
  return { remove, pending }
}
