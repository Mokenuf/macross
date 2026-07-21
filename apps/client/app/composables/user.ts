import type { Profile } from '@macross/shared'

export function useGetProfile() {
  const { data, pending, refresh, error } = useFetch<Profile>('/api/profile', {
    key: 'profile',
  })

  return {
    profile: data,
    loading: pending,
    refresh,
    error,
  }
}
