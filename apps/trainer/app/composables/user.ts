import type { AdminUser } from '@macross/shared'

export function useUser() {
  function getMe() {
    return useFetch<AdminUser>('/api/users/me', {
      key: 'user-me',
      headers: useRequestHeaders(['cookie']),
    })
  }

  return { getMe }
}
