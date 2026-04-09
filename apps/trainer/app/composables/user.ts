import type { AdminUser } from '@macross/shared'

export function useGetMe() {
  return useFetch<AdminUser>('/api/users/me', {
    key: 'user-me',
    headers: useRequestHeaders(['cookie']),
  })
}
