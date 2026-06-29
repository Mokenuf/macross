import {
  defaultPagination,
  type TrainerFilters,
  type ApiError,
  type BaseResponse,
  type CreateTrainer,
  type Pagination,
  type Trainer,
  type UpdateTrainer,
} from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useGetTrainerList() {
  const filters = useQueryFilters<TrainerFilters>({
    page: 1,
    limit: 20,
    search: '',
    role: '',
    sort: 'createdAt',
    order: 'desc',
  })

  const { data, pending, refresh, error } = useFetch<BaseResponse<Trainer>>('/api/trainers', {
    key: 'trainers',
    query: filters,
  })

  const trainers = computed<Trainer[]>(() => data.value?.rows ?? [])
  const pagination = computed<Pagination>(() => data.value?.pagination ?? defaultPagination)

  return {
    trainers,
    pagination,
    loading: pending,
    refresh,
    error,
    ...filters,
  }
}

export function useGetTrainer(nanoId: string) {
  const { data, pending, refresh, error } = useFetch<Trainer>(`/api/trainers/${nanoId}`, {
    key: `trainer-${nanoId}`,
  })

  return { trainer: data, loading: pending, refresh, error }
}

export function useCreateTrainer() {
  const pending = ref(false)
  const toast = useToast()
  const { t } = useI18n()

  async function create(input: CreateTrainer) {
    pending.value = true
    try {
      await $fetch('/api/trainers', { method: 'POST', body: input })
      await refreshNuxtData('trainers')
      await navigateTo('/trainers')
      toast.add({
        title: t('trainers.toasts.created'),
        description: t('trainers.toasts.createdMessage', { email: input.email }),
        color: 'success',
      })
    } catch (e) {
      toast.add({
        title: t('common.toasts.error'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('trainers.toasts.createError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { create, pending }
}

export function useUpdateTrainer() {
  const pending = ref(false)
  const toast = useToast()
  const { t } = useI18n()

  async function update(nanoId: string, input: UpdateTrainer) {
    pending.value = true
    try {
      await $fetch(`/api/trainers/${nanoId}`, { method: 'PATCH', body: input })
      await refreshNuxtData('trainers')
      await refreshNuxtData('me')
      await navigateTo('/trainers')
      toast.add({ title: t('trainers.toasts.updated'), color: 'success' })
    } catch (e) {
      toast.add({
        title: t('common.toasts.error'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('trainers.toasts.updateError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { update, pending }
}

export function useDeleteTrainer() {
  const pending = ref(false)
  const toast = useToast()
  const { t } = useI18n()

  async function remove(nanoId: string) {
    pending.value = true
    try {
      await $fetch(`/api/trainers/${nanoId}`, { method: 'DELETE' })
      await refreshNuxtData('trainers')
      toast.add({ title: t('trainers.toasts.deleted'), color: 'success' })
    } catch (e) {
      toast.add({
        title: t('common.toasts.error'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('trainers.toasts.deleteError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { remove, pending }
}
