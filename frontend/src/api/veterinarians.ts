import { api } from '../lib/api'
import type { ApiVeterinarian, ListVeterinariansParams, PaginatedResult, VeterinarianInput } from '../types'

/** Igual que en owners: evita mandar campos opcionales vacíos y pisar
 * `licenseNumber` con '' (rompería el índice único parcial, que solo
 * excluye NULL, no ''). */
function cleanInput(input: VeterinarianInput): VeterinarianInput {
  const entries = Object.entries(input).filter(([, value]) => value !== '' && value !== undefined)
  return Object.fromEntries(entries) as unknown as VeterinarianInput
}

export function listVeterinarians(
  params: ListVeterinariansParams = {},
): Promise<PaginatedResult<ApiVeterinarian>> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.active !== undefined) qs.set('active', String(params.active))
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return api.get<PaginatedResult<ApiVeterinarian>>(`/veterinarians${query ? `?${query}` : ''}`)
}

export function createVeterinarian(input: VeterinarianInput): Promise<ApiVeterinarian> {
  return api.post<ApiVeterinarian>('/veterinarians', cleanInput(input))
}

export function updateVeterinarian(id: number, input: VeterinarianInput): Promise<ApiVeterinarian> {
  return api.patch<ApiVeterinarian>(`/veterinarians/${id}`, cleanInput(input))
}

export function deleteVeterinarian(id: number): Promise<void> {
  return api.delete<void>(`/veterinarians/${id}`)
}
