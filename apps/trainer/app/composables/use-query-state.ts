const pendingQuery: Record<string, string | undefined> = {}
let flushScheduled = false
function flushQueryUpdates() {
  const route = useRoute()
  const router = useRouter()

  const query = { ...route.query }
  for (const [key, value] of Object.entries(pendingQuery)) {
    if (value === undefined) {
      delete query[key]
    } else {
      query[key] = value
    }
  }

  Object.keys(pendingQuery).forEach(key => delete pendingQuery[key])
  flushScheduled = false
  router.replace({ query })
}

export function useQueryState<T extends string | number>(key: string, defaultValue: T) {
  const route = useRoute()

  return computed<T>({
    get: () => {
      const raw = route.query[key]
      if (raw === undefined) return defaultValue
      if (typeof defaultValue === 'number') return Number(raw) as T
      return raw as T
    },
    set: val => {
      if (val === defaultValue || val === '' || val === undefined) {
        pendingQuery[key] = undefined
      } else {
        pendingQuery[key] = String(val)
      }
      if (!flushScheduled) {
        flushScheduled = true
        nextTick(flushQueryUpdates)
      }
    },
  })
}
