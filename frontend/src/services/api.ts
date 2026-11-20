import axios from 'axios'
import type { ChatRequest, ChatResponse } from '../types'

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