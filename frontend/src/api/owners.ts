import { api } from '../lib/api'
import type { ApiOwner, ListOwnersParams, OwnerInput, PaginatedResult } from '../types'

/** Quita campos opcionales en blanco antes de mandarlos al backend, para no
 * pisar `document`/`phone`/etc. con strings vacíos (rompería el índice único
 * parcial de `document`, que solo excluye NULL, no '').  */
function cleanInput(input: OwnerInput): OwnerInput {
  const entries = Object.entries(input).filter(([, value]) => value !== '' && value !== undefined)
  return Object.fromEntries(entries) as unknown as OwnerInput
}

export function listOwners(params: ListOwnersParams = {}): Promise<PaginatedResult<ApiOwner>> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.active !== undefined) qs.set('active', String(params.active))
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return api.get<PaginatedResult<ApiOwner>>(`/owners${query ? `?${query}` : ''}`)
}

export function createOwner(input: OwnerInput): Promise<ApiOwner> {
  return api.post<ApiOwner>('/owners', cleanInput(input))
}

export function updateOwner(id: number, input: OwnerInput): Promise<ApiOwner> {
  return api.patch<ApiOwner>(`/owners/${id}`, cleanInput(input))
}

export function deleteOwner(id: number): Promise<void> {
  return api.delete<void>(`/owners/${id}`)
}
