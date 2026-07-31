import { api } from '../lib/api'
import type {
  ApiAppointment,
  AppointmentInput,
  AppointmentStatus,
  ListAppointmentsParams,
  RescheduleAppointmentInput,
} from '../types'

/** A diferencia de pets/owners/vets/products, la agenda no está paginada:
 * el backend devuelve un array plano ordenado por `startAt`. */
export function listAppointments(params: ListAppointmentsParams = {}): Promise<ApiAppointment[]> {
  const qs = new URLSearchParams()
  if (params.veterinarianId !== undefined) qs.set('veterinarianId', String(params.veterinarianId))
  if (params.petId !== undefined) qs.set('petId', String(params.petId))
  if (params.date) qs.set('date', params.date)
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  if (params.status) qs.set('status', params.status)
  const query = qs.toString()
  return api.get<ApiAppointment[]>(`/appointments${query ? `?${query}` : ''}`)
}

export function getAppointment(id: number): Promise<ApiAppointment> {
  return api.get<ApiAppointment>(`/appointments/${id}`)
}

export function createAppointment(input: AppointmentInput): Promise<ApiAppointment> {
  return api.post<ApiAppointment>('/appointments', input)
}

export function rescheduleAppointment(id: number, input: RescheduleAppointmentInput): Promise<ApiAppointment> {
  return api.patch<ApiAppointment>(`/appointments/${id}/reschedule`, input)
}

export function changeAppointmentStatus(id: number, status: AppointmentStatus): Promise<ApiAppointment> {
  return api.patch<ApiAppointment>(`/appointments/${id}/status`, { status })
}

export function cancelAppointment(id: number): Promise<ApiAppointment> {
  return api.patch<ApiAppointment>(`/appointments/${id}/cancel`)
}
