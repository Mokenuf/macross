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

function serializeArray(values: string[]): string {
  return `[${values.join(',')}]`
}
function parseArray(raw: string): string[] {
  return raw
    .replace(/^\[|\]$/g, '')
    .split(',')
    .filter(Boolean)
}

export function useQueryState<T extends string | number | string[]>(key: string, defaultValue: T) {
  const route = useRoute()
  const isArray = Array.isArray(defaultValue)

  return computed<T>({
    get: () => {
      const raw = route.query[key]
      if (isArray) {
        if (typeof raw !== 'string' || raw === '') return defaultValue
        return parseArray(raw) as T
      }
      if (raw === undefined) return defaultValue
      if (typeof defaultValue === 'number') return Number(raw) as T
      return raw as T
    },
    set: val => {
      if (isArray) {
        const arr = (val as string[]) ?? []
        pendingQuery[key] = arr.length === 0 ? undefined : serializeArray(arr)
      } else if (val === defaultValue || val === '' || val === undefined) {
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
