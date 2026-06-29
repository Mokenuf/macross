import type { ApiError, Login, RequestPasswordReset, SetPassword } from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useLogin() {
  const { t } = useI18n()
  const toast = useToast()

  async function login(input: Login) {
    try {
      await $fetch('/api/auth/login', { method: 'POST', body: input })
      toast.add({ title: t('auth.toasts.login.success'), color: 'success' })
      await navigateTo('/', { external: true })
    } catch (e) {
      toast.add({
        title: t('auth.toasts.error.title'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('auth.toasts.error.description'),
        color: 'error',
      })
    }
  }

  return { login }
}

export function useLogout() {
  const { t } = useI18n()
  const toast = useToast()

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    toast.add({ title: t('auth.toasts.logout.success'), color: 'success' })
    await navigateTo('/auth/login', { external: true })
  }

  return { logout }
}

export function useRequestPasswordReset() {
  const { t } = useI18n()
  const toast = useToast()

  async function requestPasswordReset(input: RequestPasswordReset) {
    try {
      await $fetch('/api/auth/forgot-password', { method: 'POST', body: input })
      toast.add({
        title: t('auth.toasts.resetPassword.success'),
        description: t('auth.toasts.resetPassword.successDescription'),
        color: 'success',
      })
    } catch (e) {
      toast.add({
        title: t('auth.toasts.error.title'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('auth.toasts.error.description'),
        color: 'error',
      })
    }
  }

  return { requestPasswordReset }
}

export function useSetPassword() {
  const { t } = useI18n()
  const toast = useToast()

  async function setPassword(input: SetPassword) {
    try {
      await $fetch('/api/auth/set-password', { method: 'POST', body: input })
      toast.add({ title: t('auth.toasts.setPassword.success'), color: 'success' })
      await navigateTo('/', { external: true })
    } catch (e) {
      toast.add({
        title: t('auth.toasts.error.title'),
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('auth.toasts.error.description'),
        color: 'error',
      })
    }
  }

  return { setPassword }
}
