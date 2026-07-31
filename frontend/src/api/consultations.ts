import { api } from '../lib/api'
import type {
  ApiConsultation,
  ConsultationInput,
  ConsultationUpdateInput,
  ListConsultationsParams,
  PaginatedResult,
} from '../types'

export function listConsultations(
  params: ListConsultationsParams = {},
): Promise<PaginatedResult<ApiConsultation>> {
  const qs = new URLSearchParams()
  if (params.petId !== undefined) qs.set('petId', String(params.petId))
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return api.get<PaginatedResult<ApiConsultation>>(`/consultations${query ? `?${query}` : ''}`)
}

export function getConsultation(id: number): Promise<ApiConsultation> {
  return api.get<ApiConsultation>(`/consultations/${id}`)
}

export function createConsultation(input: ConsultationInput): Promise<ApiConsultation> {
  return api.post<ApiConsultation>('/consultations', input)
}

export function updateConsultation(id: number, input: ConsultationUpdateInput): Promise<ApiConsultation> {
  return api.patch<ApiConsultation>(`/consultations/${id}`, input)
}
