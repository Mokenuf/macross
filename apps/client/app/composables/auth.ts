import type { ApiError, Login, RequestPasswordReset, SetPassword } from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useLogin() {
  const toast = useToast()
  const { t } = useI18n()

  async function login(input: Login) {
    try {
      await $fetch('/api/auth/login', { method: 'POST', body: input })
      toast.add({ title: t('auth.toasts.loginSuccess'), color: 'success' })
      await navigateTo('/', { external: true })
    } catch (e) {
      toast.add({
        title: t('auth.toasts.error'),
        description: (e as FetchError<ApiError>).data?.statusMessage ?? t('auth.errors.generic'),
        color: 'error',
      })
    }
  }

  return { login }
}

export function useLogout() {
  const toast = useToast()
  const { t } = useI18n()

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    toast.add({ title: t('auth.toasts.logoutSuccess'), color: 'success' })
    await navigateTo('/auth/login', { external: true })
  }

  return { logout }
}

export function useRequestPasswordReset() {
  const toast = useToast()
  const { t } = useI18n()

  async function requestPasswordReset(input: RequestPasswordReset) {
    try {
      await $fetch('/api/auth/forgot-password', { method: 'POST', body: input })
      toast.add({
        title: t('auth.toasts.passwordResetRequested'),
        description: t('auth.toasts.passwordResetDescription'),
        color: 'success',
      })
    } catch (e) {
      toast.add({
        title: t('auth.toasts.error'),
        description: (e as FetchError<ApiError>).data?.statusMessage ?? t('auth.errors.generic'),
        color: 'error',
      })
    }
  }

  return { requestPasswordReset }
}

export function useSetPassword() {
  const toast = useToast()
  const { t } = useI18n()

  async function setPassword(input: SetPassword) {
    try {
      await $fetch('/api/auth/set-password', { method: 'POST', body: input })
      toast.add({ title: t('auth.toasts.passwordUpdated'), color: 'success' })
      await navigateTo('/', { external: true })
    } catch (e) {
      toast.add({
        title: t('auth.toasts.error'),
        description: (e as FetchError<ApiError>).data?.statusMessage ?? t('auth.errors.generic'),
        color: 'error',
      })
    }
  }

  return { setPassword }
}
