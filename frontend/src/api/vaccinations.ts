import { api } from '../lib/api'
import type {
  ApiVaccination,
  ListVaccinationsParams,
  PaginatedResult,
  UpcomingVaccinationsParams,
  VaccinationInput,
} from '../types'

export function listVaccinations(params: ListVaccinationsParams = {}): Promise<PaginatedResult<ApiVaccination>> {
  const qs = new URLSearchParams()
  if (params.petId !== undefined) qs.set('petId', String(params.petId))
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return api.get<PaginatedResult<ApiVaccination>>(`/vaccinations${query ? `?${query}` : ''}`)
}

export function listUpcomingVaccinations(params: UpcomingVaccinationsParams = {}): Promise<ApiVaccination[]> {
  const qs = new URLSearchParams()
  if (params.days !== undefined) qs.set('days', String(params.days))
  const query = qs.toString()
  return api.get<ApiVaccination[]>(`/vaccinations/upcoming${query ? `?${query}` : ''}`)
}

export function getVaccination(id: number): Promise<ApiVaccination> {
  return api.get<ApiVaccination>(`/vaccinations/${id}`)
}

export function createVaccination(input: VaccinationInput): Promise<ApiVaccination> {
  return api.post<ApiVaccination>('/vaccinations', input)
}
