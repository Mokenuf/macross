import type { TableColumn } from '@nuxt/ui'

export type { TableColumn }

export type ActionType = 'view' | 'edit' | 'delete' | 'custom'

export type ActionColor =
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'

export interface TableAction<T> {
  type: ActionType
  label?: string
  icon?: string
  color?: ActionColor
  visible?: ComputedRef<boolean> | boolean | ((row: T) => boolean)
  href?: ((row: T) => string) | string
  onSelect?: (row: T) => void | Promise<void>
  disabled?: ((row: T) => boolean) | boolean
}
