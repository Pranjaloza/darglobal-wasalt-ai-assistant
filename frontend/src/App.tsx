
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import { sendChatMessage } from './services/api'
import type { ChatMessage } from './types'
import axios from 'axios'

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNewChat = () => {
    setMessages([])
    setError('')
    setIsLoading(false)
  }

  const handleSendMessage = async (message: string) => {
    if (isLoading || !message.trim()) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    }

    setMessages((previous) => [...previous, userMessage])
    setIsLoading(true)
    setError('')

    try {
      const response = await sendChatMessage(message)

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        properties: response.properties ?? [],
        sources: response.sources ?? [],
        timestamp: new Date(),
      }

      setMessages((previous) => [...previous, assistantMessage])
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('API error:', err.response?.status, err.response?.data)

        const detail = err.response?.data?.detail

        if (!err.response) {
          // No response at all: backend down, wrong URL, CORS, or timeout
          setError(
            err.code === 'ECONNABORTED'
              ? 'The AI assistant took too long to respond. Please try again.'
              : 'Unable to connect to the AI assistant. Please check that the backend is running and try again.'
          )
        } else if (typeof detail === 'string') {
          setError(detail)
        } else {
          setError(`The AI assistant returned an error (${err.response.status}). Please try again.`)
        }
      } else {
        console.error('Chat error:', err)
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8FA]">
      <Sidebar onNewChat={handleNewChat} />

      <ChatWindow
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

export default App
