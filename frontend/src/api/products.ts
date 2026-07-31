import { api } from '../lib/api'
import type {
  ApiProduct,
  ApiProductCategory,
  ListProductCategoriesParams,
  ListProductsParams,
  PaginatedResult,
  ProductCategoryInput,
  ProductInput,
} from '../types'

/** Igual que en owners/veterinarians: evita mandar campos opcionales vacíos
 * (ej. sku '') que pisarían valores existentes o rompan índices únicos parciales. */
function cleanInput<T extends object>(input: T): T {
  const entries = Object.entries(input).filter(([, value]) => value !== '' && value !== undefined)
  return Object.fromEntries(entries) as T
}

export function listProducts(params: ListProductsParams = {}): Promise<PaginatedResult<ApiProduct>> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.categoryId !== undefined) qs.set('categoryId', String(params.categoryId))
  if (params.active !== undefined) qs.set('active', String(params.active))
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return api.get<PaginatedResult<ApiProduct>>(`/products${query ? `?${query}` : ''}`)
}

export function createProduct(input: ProductInput): Promise<ApiProduct> {
  return api.post<ApiProduct>('/products', cleanInput(input))
}

export function updateProduct(id: number, input: ProductInput): Promise<ApiProduct> {
  return api.patch<ApiProduct>(`/products/${id}`, cleanInput(input))
}

export function deleteProduct(id: number): Promise<void> {
  return api.delete<void>(`/products/${id}`)
}

export function listProductCategories(
  params: ListProductCategoriesParams = {},
): Promise<PaginatedResult<ApiProductCategory>> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.active !== undefined) qs.set('active', String(params.active))
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return api.get<PaginatedResult<ApiProductCategory>>(`/product-categories${query ? `?${query}` : ''}`)
}

export function createProductCategory(input: ProductCategoryInput): Promise<ApiProductCategory> {
  return api.post<ApiProductCategory>('/product-categories', input)
}

export function deleteProductCategory(id: number): Promise<void> {
  return api.delete<void>(`/product-categories/${id}`)
}
