import {
  defaultPagination,
  type ApiError,
  type BaseResponse,
  type CreateRoutine,
  type Pagination,
  type Routine,
  type RoutineFilters,
  type UpdateRoutine,
} from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useGetRoutineList() {
  const filters = useQueryFilters<RoutineFilters>({
    page: 1,
    limit: 20,
    search: '',
    clientId: '',
    status: 'active',
    sort: 'createdAt',
    order: 'desc',
  })

  const { data, pending, refresh, error } = useFetch<BaseResponse<Routine>>('/api/routines', {
    key: 'routines',
    query: filters,
  })

  const routines = computed<Routine[]>(() => data.value?.rows ?? [])
  const pagination = computed<Pagination>(() => data.value?.pagination ?? defaultPagination)
  const counts = computed(() => data.value?.counts)

  return {
    routines,
    pagination,
    counts,
    loading: pending,
    refresh,
    error,
    ...filters,
  }
}

export function useGetRoutine(nanoId: string) {
  const { data, pending, refresh, error } = useFetch<Routine>(`/api/routines/${nanoId}`, {
    key: `routine-${nanoId}`,
  })

  return { routine: data, loading: pending, refresh, error }
}

export function useCreateRoutine() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function create(input: CreateRoutine) {
    pending.value = true
    try {
      await $fetch('/api/routines', { method: 'POST', body: input })
      await refreshNuxtData('routines')
      await navigateTo('/routines')
      toast.add({ title: t('routines.toasts.created'), color: 'success' })
    } catch (e) {
      toast.add({
        title: t('common.toasts.error'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('routines.toasts.createError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { create, pending }
}

export function useUpdateRoutine() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function update(nanoId: string, input: UpdateRoutine) {
    pending.value = true
    try {
      await $fetch(`/api/routines/${nanoId}`, { method: 'PATCH', body: input })
      await refreshNuxtData('routines')
      await navigateTo('/routines')
      toast.add({ title: t('routines.toasts.updated'), color: 'success' })
    } catch (e) {
      toast.add({
        title: t('common.toasts.error'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('routines.toasts.updateError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { update, pending }
}

export function useDeleteRoutine() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function remove(nanoId: string) {
    pending.value = true
    try {
      await $fetch(`/api/routines/${nanoId}`, { method: 'DELETE' })
      await refreshNuxtData('routines')
      toast.add({ title: t('routines.toasts.deleted'), color: 'success' })
    } catch (e) {
      toast.add({
        title: t('common.toasts.error'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('routines.toasts.deleteError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { remove, pending }
}

export function useFinishRoutine() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function finish(nanoId: string) {
    pending.value = true
    try {
      await $fetch(`/api/routines/${nanoId}/finish`, { method: 'POST' })
      await refreshNuxtData('routines')
      toast.add({ title: t('routines.toasts.finished'), color: 'success' })
    } catch (e) {
      toast.add({
        title: t('common.toasts.error'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('routines.toasts.finishError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { finish, pending }
}
