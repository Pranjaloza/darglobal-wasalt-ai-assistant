import { useCallback, useEffect, useState } from 'react'
import type { ChatMessage, Conversation } from '../types'

const STORAGE_KEY = 'estate-intelligence:conversations'
const MAX_CONVERSATIONS = 30

function load(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Private mode, blocked storage or corrupt data: start empty
    return []
  }
}

function save(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch {
    // Storage full or unavailable: history just won't persist
  }
}

function titleFrom(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 48 ? `${clean.slice(0, 45)}…` : clean
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(load)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    save(conversations)
  }, [conversations])

  const active = conversations.find((c) => c.id === activeId) ?? null

  /** Start a fresh, empty chat (nothing is saved until the first message). */
  const startNew = useCallback(() => setActiveId(null), [])

  /** Add a message to a conversation, creating it if needed. Returns its id. */
  const addMessage = useCallback(
    (conversationId: string | null, message: ChatMessage): string => {
      const id = conversationId ?? crypto.randomUUID()
      const now = new Date().toISOString()

      setConversations((previous) => {
        const existing = previous.find((c) => c.id === id)

        if (!existing) {
          // Answer arrived for a conversation that was deleted meanwhile
          if (conversationId && message.role === 'assistant') return previous

          const created: Conversation = {
            id,
            title: titleFrom(message.content),
            messages: [message],
            createdAt: now,
            updatedAt: now,
          }
          return [created, ...previous].slice(0, MAX_CONVERSATIONS)
        }

        const updated = {
          ...existing,
          messages: [...existing.messages, message],
          updatedAt: now,
        }
        // Most recently used first
        return [updated, ...previous.filter((c) => c.id !== id)]
      })

      return id
    },
    []
  )

  const remove = useCallback((id: string) => {
    setConversations((previous) => previous.filter((c) => c.id !== id))
    setActiveId((current) => (current === id ? null : current))
  }, [])

  const clearAll = useCallback(() => {
    setConversations([])
    setActiveId(null)
  }, [])

  return {
    conversations,
    active,
    activeId,
    setActiveId,
    startNew,
    addMessage,
    remove,
    clearAll,
  }
}
