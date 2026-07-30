export type Screen =
  | 'dashboard'
  | 'duenos'
  | 'mascotas'
  | 'turnos'
  | 'historia'
  | 'vacunas'
  | 'productos'
  | 'stock'
  | 'veterinarios'

export type ApptStatus = 'Pendiente' | 'Confirmado' | 'Atendido' | 'Cancelado'

export interface Owner {
  id: number
  name: string
  dni: string
  email: string
  phone: string
  address: string
  petIds: number[]
  since: string
}
export interface Pet {
  id: number
  name: string
  species: string
  breed: string
  ownerId: number
  age: number
  weight: number
  color: string
  microchip?: string
  since: string
}
export interface Appt {
  id: number
  petId: number
  ownerId: number
  vetId: number
  date: string
  time: string
  duration: number
  reason: string
  status: ApptStatus
}
export interface Vet {
  id: number
  name: string
  specialty: string
  hue: string
}
export interface Product {
  id: number
  name: string
  category: string
  qty: number
  min: number
  unit: string
  price: number
  supplier: string
}
export interface MedRecord {
  id: number
  petId: number
  date: string
  vetId: number
  reason: string
  diagnosis: string
  treatment: string
  notes: string
  weightKg?: number
}
export interface Vaccine {
  id: number
  petId: number
  name: string
  date: string
  nextDue: string
  vetId: number
  batch: string
}

// ─── Catalog products (with cost/margin) ──────────────────────────────────────

export interface CatalogProduct {
  id: number
  name: string
  category: string
  price: number
  cost: number
  barcode?: string
  iva: number
  controlsStock: boolean
  qty: number
  min: number
  unit: string
}

// ─── Veterinary staff ─────────────────────────────────────────────────────────

export interface VetStaff {
  id: number
  name: string
  matricula: string
  specialty: string
  phone: string
  email: string
  active: boolean
}
