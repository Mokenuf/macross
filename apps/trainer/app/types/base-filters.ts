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
  default?: string | string[] // valor al que "Limpiar filtros" resetea (ej: status → 'active')
}

export type Filter = SearchFilter | SelectFilter
