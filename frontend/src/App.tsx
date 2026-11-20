import axios from 'axios'
import { useEffect, useState } from 'react'
import ChatWindow from './components/ChatWindow'
import PropertyDiscovery from './components/PropertyDiscovery'
import Sidebar from './components/Sidebar'
import { useApiStatus } from './hooks/useApiStatus'
import { useConversations } from './hooks/useConversations'
import { getDatasetStats, sendChatMessage } from './services/api'
import type { ChatMessage, DatasetStats, HistoryMessage, View } from './types'

// How many earlier messages are sent with each question (for follow-ups)
const HISTORY_LIMIT = 6

function toHistory(messages: ChatMessage[]): HistoryMessage[] {
  return messages.slice(-HISTORY_LIMIT).map(({ role, content }) => ({ role, content }))
}

const SIDEBAR_KEY = 'estate-intelligence:sidebar-collapsed'

function errorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    console.error('API error:', err.response?.status, err.response?.data)

    if (!err.response) {
      return err.code === 'ECONNABORTED'
        ? 'The AI assistant took too long to respond. Please try again.'
        : 'Unable to reach the AI assistant. It may be waking up — please try again in a moment.'
    }

    const detail = err.response.data?.detail
    return typeof detail === 'string'
      ? detail
      : `The AI assistant returned an error (${err.response.status}). Please try again.`
  }

  console.error('Chat error:', err)
  return 'Something went wrong. Please try again.'
}

function App() {
  const { conversations, active, activeId, setActiveId, startNew, addMessage, remove } =
    useConversations()

  const [view, setView] = useState<View>('chat')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })

  // Which conversation is waiting for an answer / last failed (null = new chat)
  const [pendingId, setPendingId] = useState<string | null | undefined>(undefined)
  const [failure, setFailure] = useState<{ conversationId: string; question: string; message: string } | null>(null)

  const apiStatus = useApiStatus()
  const [stats, setStats] = useState<DatasetStats | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      // ignore
    }
  }, [collapsed])

  // Load dataset stats once the backend is reachable
  useEffect(() => {
    if (apiStatus !== 'online' || stats) return
    getDatasetStats().then(setStats).catch(() => setStats(null))
  }, [apiStatus, stats])

  const isLoading = pendingId !== undefined

  const requestAnswer = async (conversationId: string, question: string, history: HistoryMessage[]) => {
    setPendingId(conversationId)
    setFailure(null)

    try {
      const response = await sendChatMessage(question, history)

      addMessage(conversationId, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        properties: response.properties ?? [],
        sources: response.sources ?? [],
        model: response.model,
        filters: response.filters ?? null,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      setFailure({ conversationId, question, message: errorMessage(err) })
    } finally {
      setPendingId(undefined)
    }
  }

  const handleSendMessage = (text: string) => {
    if (isLoading || !text.trim()) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    // Earlier messages in this conversation, before the new question
    const history = toHistory(active?.messages ?? [])

    const conversationId = addMessage(activeId, userMessage)
    setActiveId(conversationId)
    requestAnswer(conversationId, text, history)
  }

  const handleRetry = () => {
    if (!failure || isLoading) return
    // Everything before the failed question (which is the last message)
    const messages = conversations.find((c) => c.id === failure.conversationId)?.messages ?? []
    requestAnswer(failure.conversationId, failure.question, toHistory(messages.slice(0, -1)))
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const handleNewChat = () => {
    startNew()
    setView('chat')
    closeMobileMenu()
  }

  const handleSelectConversation = (id: string) => {
    setActiveId(id)
    setView('chat')
    closeMobileMenu()
  }

  const handleChangeView = (next: View) => {
    setView(next)
    closeMobileMenu()
  }

  // Only show loading / errors inside the conversation they belong to
  const showLoading = isLoading && pendingId === activeId
  const visibleError = failure && failure.conversationId === activeId ? failure.message : ''

  return (
    <div className="flex h-dvh overflow-hidden bg-paper text-ink">
      <Sidebar
        view={view}
        onChangeView={handleChangeView}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={remove}
        onNewChat={handleNewChat}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={closeMobileMenu}
        apiStatus={apiStatus}
        stats={stats}
      />

      {view === 'chat' ? (
        <ChatWindow
          title={active?.title ?? 'New conversation'}
          messages={active?.messages ?? []}
          onSendMessage={handleSendMessage}
          onRetry={handleRetry}
          isLoading={isLoading}
          isThinking={showLoading}
          error={visibleError}
          apiStatus={apiStatus}
          stats={stats}
          onOpenMenu={() => setMobileMenuOpen(true)}
          onOpenListings={() => handleChangeView('discovery')}
        />
      ) : (
        <PropertyDiscovery stats={stats} onOpenMenu={() => setMobileMenuOpen(true)} />
      )}
    </div>
  )
}

export default App
