export interface Property {
  title: string
  price: number | null
  currency: string
  bedrooms: number | null
  area: number | null
  area_unit?: string
  city?: string
  locality?: string
  facing?: string
  source_url: string
}

export interface Source {
  title: string
  company?: string
  url: string
}

export interface ChatResponse {
  answer: string
  filters?: Record<string, unknown> | null
  total_returned?: number
  properties?: Property[]
  sources: Source[]
  retrieved_documents?: number
  model?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  properties?: Property[]
  sources?: Source[]
  model?: string
  // ISO string, so conversations can be saved to localStorage
  timestamp: string
}

export interface ChatRequest {
  question: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface PropertyFilters {
  city?: string
  max_price?: number
  min_bedrooms?: number
  exact_bedrooms?: number
  limit?: number
}

export interface PropertySearchResponse {
  filters: Record<string, unknown>
  total_returned: number
  properties: Property[]
}

export interface DatasetStats {
  total_listings: number
  darglobal_pages: number
  cities: { name: string; count: number }[]
  price_range: { min: number; max: number } | null
  bedroom_range: { min: number; max: number } | null
  currency: string
}

export type View = 'chat' | 'discovery'

export type ApiStatus = 'checking' | 'online' | 'offline'
