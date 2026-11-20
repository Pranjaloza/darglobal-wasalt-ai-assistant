import axios from 'axios'
import type {
  ChatRequest,
  ChatResponse,
  DatasetStats,
  PropertyFilters,
  PropertySearchResponse,
} from '../types'

// Dev: set in frontend/.env.development (backend on :8001).
// Production build: empty, so requests go to the same origin that served the page.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Backend may retry the LLM call once (up to 90s each)
  timeout: 180000,
})

export const sendChatMessage = async (
  question: string
): Promise<ChatResponse> => {
  const payload: ChatRequest = { question }
  const response = await api.post<ChatResponse>('/chat', payload)
  return response.data
}

export const checkApiHealth = async () => {
  const response = await api.get('/health')
  return response.data
}
export const searchProperties = async (
  filters: PropertyFilters
): Promise<PropertySearchResponse> => {
  // Drop empty values so the backend only receives filters the user set
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  )
  const response = await api.get<PropertySearchResponse>('/properties', { params })
  return response.data
}

export const getDatasetStats = async (): Promise<DatasetStats> => {
  const response = await api.get<DatasetStats>('/api/stats')
  return response.data
}
