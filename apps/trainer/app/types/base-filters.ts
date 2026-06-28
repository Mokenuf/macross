import type { SelectItem } from '@nuxt/ui'

interface BaseFilter {
  key: string
  label: string
  placeholder?: string
}

export interface SearchFilter extends BaseFilter {
  type: 'search'
  debounce?: number
}

export interface SelectFilter extends BaseFilter {
  type: 'select'
  options: SelectItem[]
  searchable?: boolean
  multiple?: boolean
}

export type Filter = SearchFilter | SelectFilter
