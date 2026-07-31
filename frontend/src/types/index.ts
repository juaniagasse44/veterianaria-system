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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'EMPLOYEE'

export interface AuthUser {
  id: number
  email: string
  fullName: string
  role: UserRole
  active: boolean
  creationDate: string
  lastUpdateDate: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

// ─── API — generic ────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ─── API — Owners (backend real, distinto del mock `Owner` de arriba) ─────────

export interface ApiOwner {
  id: number
  fullName: string
  document: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  active: boolean
  creationDate: string
  lastUpdateDate: string
}

export interface OwnerInput {
  fullName: string
  document?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export interface ListOwnersParams {
  search?: string
  active?: boolean
  page?: number
  limit?: number
}

// ─── API — Veterinarians (backend real, distinto del mock `VetStaff`) ─────────

export interface ApiVeterinarian {
  id: number
  fullName: string
  licenseNumber: string | null
  specialty: string | null
  phone: string | null
  email: string | null
  active: boolean
  creationDate: string
  lastUpdateDate: string
}

export interface VeterinarianInput {
  fullName: string
  licenseNumber?: string
  specialty?: string
  phone?: string
  email?: string
}

export interface ListVeterinariansParams {
  search?: string
  active?: boolean
  page?: number
  limit?: number
}

// ─── API — Products & categories (backend real) ───────────────────────────────

export type ProductUnit = 'UNIDAD' | 'KG' | 'LT'

export interface ApiProductCategory {
  id: number
  name: string
  active: boolean
  creationDate: string
  lastUpdateDate: string
}

export interface ProductCategoryInput {
  name: string
}

export interface ListProductCategoriesParams {
  search?: string
  active?: boolean
  page?: number
  limit?: number
}

export interface ApiProduct {
  id: number
  categoryId: number | null
  sku: string | null
  barcode: string | null
  name: string
  description: string | null
  salePrice: number
  cost: number
  vatRate: number | null
  unit: ProductUnit
  trackStock: boolean
  active: boolean
  creationDate: string
  lastUpdateDate: string
  margin: { amount: number; percent: number | null }
}

export interface ProductInput {
  name: string
  salePrice: number
  categoryId?: number
  sku?: string
  barcode?: string
  description?: string
  cost?: number
  vatRate?: number
  unit?: ProductUnit
  trackStock?: boolean
}

export interface ListProductsParams {
  search?: string
  categoryId?: number
  active?: boolean
  page?: number
  limit?: number
}

// ─── API — Stock (backend real) ────────────────────────────────────────────────

export interface ApiStockLevel {
  id: number
  productId: number
  product: Omit<ApiProduct, 'margin'>
  quantity: number
  minQuantity: number
  creationDate: string
  lastUpdateDate: string
}

export type StockMovementType = 'INITIAL' | 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN'

export interface ApiStockMovement {
  id: number
  productId: number
  quantity: number
  type: StockMovementType
  unitCost: number | null
  referenceType: string | null
  referenceId: number | null
  notes: string | null
  creationDate: string
}

export interface StockValuationItem {
  productId: number
  productName: string
  quantity: number
  cost: number
  value: number
}

export interface StockValuation {
  total: number
  items: StockValuationItem[]
}

export interface InitialStockInput {
  productId: number
  quantity: number
  minQuantity?: number
  notes?: string
}

export interface AdjustStockInput {
  productId: number
  quantity: number
  minQuantity?: number
  notes?: string
}
