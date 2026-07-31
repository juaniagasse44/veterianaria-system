import { api } from '../lib/api'
import type { AdjustStockInput, ApiStockLevel, ApiStockMovement, InitialStockInput, StockValuation } from '../types'

export function listStockLevels(): Promise<ApiStockLevel[]> {
  return api.get<ApiStockLevel[]>('/stock/levels')
}

export function listLowStock(): Promise<ApiStockLevel[]> {
  return api.get<ApiStockLevel[]>('/stock/low')
}

export function getStockValuation(): Promise<StockValuation> {
  return api.get<StockValuation>('/stock/valuation')
}

export function listStockMovements(productId?: number): Promise<ApiStockMovement[]> {
  const query = productId !== undefined ? `?productId=${productId}` : ''
  return api.get<ApiStockMovement[]>(`/stock/movements${query}`)
}

export function setInitialStock(input: InitialStockInput): Promise<ApiStockLevel> {
  return api.post<ApiStockLevel>('/stock/initial', input)
}

export function adjustStock(input: AdjustStockInput): Promise<ApiStockLevel> {
  return api.post<ApiStockLevel>('/stock/adjust', input)
}
