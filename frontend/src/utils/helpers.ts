import type { Product, CatalogProduct } from '../types'
import { OWNERS, PETS, VETS } from '../data/mockData'

export function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function formatPrice(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Para timestamps ISO reales del backend (a diferencia de formatDate, que
 * espera fechas simples 'YYYY-MM-DD' de los datos mock). */
export function formatApiDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function stockStatus(p: Product): 'OK' | 'Bajo' | 'Sin stock' {
  if (p.qty === 0) return 'Sin stock'
  if (p.qty < p.min) return 'Bajo'
  return 'OK'
}

export const getOwner = (id: number) => OWNERS.find(o => o.id === id)
export const getPet = (id: number) => PETS.find(p => p.id === id)
export const getVet = (id: number) => VETS.find(v => v.id === id)

export function initials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const AVATAR_PALETTE = ['#0d9488', '#7c3aed', '#ea580c', '#2563eb', '#db2777', '#16a34a', '#ca8a04', '#64748b']

/** Color determinístico para avatares de entidades reales (sin un campo de
 * color propio en el backend, a diferencia del mock `Vet.hue`). */
export function colorForId(id: number): string {
  return AVATAR_PALETTE[id % AVATAR_PALETTE.length]
}

export function catalogStockStatus(p: CatalogProduct): 'OK' | 'Bajo' | 'Sin stock' | null {
  if (!p.controlsStock) return null
  if (p.qty === 0) return 'Sin stock'
  if (p.qty < p.min) return 'Bajo'
  return 'OK'
}

export function margin(p: CatalogProduct): number {
  if (!p.cost || p.price === 0) return 0
  return Math.round(((p.price - p.cost) / p.price) * 100)
}

export const TODAY_STR = '2026-07-29'
export const TODAY_DATE = new Date(TODAY_STR + 'T00:00:00')

export function vaccDaysLeft(nextDue: string): number {
  return Math.round((new Date(nextDue + 'T00:00:00').getTime() - TODAY_DATE.getTime()) / 86400000)
}

export function vaccineStatus(nextDue: string): 'Vigente' | 'Por vencer' | 'Vencida' {
  const diff = vaccDaysLeft(nextDue)
  if (diff < 0) return 'Vencida'
  if (diff <= 30) return 'Por vencer'
  return 'Vigente'
}

/** 'YYYY-MM-DD' en horario local (a diferencia de `toISOString`, que trunca a UTC). */
export function formatDateInput(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function todayApiDate(): string {
  return formatDateInput(new Date())
}

/** Para el `startAt`/`endAt` ISO real de los turnos (a diferencia de `parseTime`,
 * que espera el 'HH:MM' plano de los datos mock). */
export function formatApiTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export function formatWeekdayDate(dateStr: string): string {
  const label = new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
