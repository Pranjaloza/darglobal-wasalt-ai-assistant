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
  timestamp: Date
}
export interface ChatRequest {
  question: string
}
