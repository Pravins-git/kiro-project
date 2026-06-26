export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  requestId: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  lastEvaluatedKey?: string;
}

export interface AuditEntry {
  eventId: string;
  userId: string;
  action: string;
  timestamp: string;
  ipAddress?: string;
  deviceInfo?: string;
  metadata?: Record<string, unknown>;
}

export type Environment = 'dev' | 'staging' | 'prod';
