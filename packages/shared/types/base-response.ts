interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface BaseResponse<T> {
  rows: T[]
  pagination: Pagination
}
