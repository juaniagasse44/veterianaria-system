import { api } from '../lib/api'
import type { ApiPet, ApiPetDetail, ListPetsParams, PaginatedResult, PetInput, PetUpdateInput } from '../types'

/** Igual que en owners/products: evita mandar campos opcionales vacíos que
 * pisarían valores existentes con ''. */
function cleanInput<T extends object>(input: T): T {
  const entries = Object.entries(input).filter(([, value]) => value !== '' && value !== undefined)
  return Object.fromEntries(entries) as T
}

export function listPets(params: ListPetsParams = {}): Promise<PaginatedResult<ApiPet>> {
  const qs = new URLSearchParams()
  if (params.ownerId !== undefined) qs.set('ownerId', String(params.ownerId))
  if (params.species) qs.set('species', params.species)
  if (params.search) qs.set('search', params.search)
  if (params.active !== undefined) qs.set('active', String(params.active))
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return api.get<PaginatedResult<ApiPet>>(`/pets${query ? `?${query}` : ''}`)
}

export function getPet(id: number): Promise<ApiPetDetail> {
  return api.get<ApiPetDetail>(`/pets/${id}`)
}

export function createPet(input: PetInput): Promise<ApiPet> {
  return api.post<ApiPet>('/pets', cleanInput(input))
}

export function updatePet(id: number, input: PetUpdateInput): Promise<ApiPet> {
  return api.patch<ApiPet>(`/pets/${id}`, cleanInput(input))
}

export function deletePet(id: number): Promise<void> {
  return api.delete<void>(`/pets/${id}`)
}
