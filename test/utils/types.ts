export interface IdResponse {
  id: number;
}

export interface LoginResponseBody {
  accessToken: string;
}

export interface PetResponseBody {
  id: number;
  weight: number | null;
}

export interface AppointmentResponseBody {
  id: number;
  status: string;
  startAt: string;
}

export interface StockLevelResponseBody {
  productId: number;
  quantity: number;
}

export interface StockMovementResponseBody {
  quantity: number;
  referenceType: string | null;
  referenceId: number | null;
}

export interface PaginatedResponseBody<T> {
  data: T[];
  total: number;
}
