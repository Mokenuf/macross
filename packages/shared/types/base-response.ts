export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const defaultPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
}

export interface BaseResponse<T> {
  rows: T[]
  pagination: Pagination
}
