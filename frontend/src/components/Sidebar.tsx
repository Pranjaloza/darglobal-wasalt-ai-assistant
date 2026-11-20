import {
  Building2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import type { ApiStatus, Conversation, DatasetStats, View } from '../types'

interface SidebarProps {
  view: View
  onChangeView: (view: View) => void
  conversations: Conversation[]
  activeId: string | null
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onNewChat: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  apiStatus: ApiStatus
  stats: DatasetStats | null
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const STATUS_STYLES: Record<ApiStatus, { dot: string; label: string }> = {
  checking: { dot: 'bg-amber-400', label: 'Connecting…' },
  online: { dot: 'bg-green-400', label: 'Online' },
  offline: { dot: 'bg-red-400', label: 'Offline' },
}

function Sidebar({
  view,
  onChangeView,
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  apiStatus,
  stats,
}: SidebarProps) {
  const navItems: { id: View; label: string; icon: typeof MessageSquare }[] = [
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'discovery', label: 'Property discovery', icon: Search },
  ]
  const status = STATUS_STYLES[apiStatus]

  // On phones the sidebar is a drawer and never collapses to icons
  const iconOnly = collapsed && !mobileOpen

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onCloseMobile}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col bg-[#111827] py-6 text-white transition-all duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${iconOnly ? 'w-[76px] px-3' : 'w-[270px] px-5'}`}
      >
        {/* Brand + collapse */}
        <div className={`mb-8 flex items-center ${iconOnly ? 'flex-col gap-4' : 'gap-3'}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C6A66B]">
            <Building2 size={22} className="text-[#111827]" />
          </div>

          {!iconOnly && (
            <div className="min-w-0 flex-1">
              <h1 className="whitespace-nowrap text-sm font-bold tracking-wide">ESTATE INTELLIGENCE</h1>
              <p className="text-[10px] tracking-[2px] text-gray-400">AI REAL ESTATE ASSISTANT</p>
            </div>
          )}

          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

          {iconOnly && (
            <button
              onClick={onToggleCollapsed}
              className="hidden rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white md:block"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={17} />
            </button>
          )}
        </div>

        <button
          onClick={onNewChat}
          title="New conversation"
          className={`mb-8 flex items-center justify-center gap-2 rounded-xl bg-[#C6A66B] font-semibold text-[#111827] transition hover:bg-[#d6b980] ${
            iconOnly ? 'h-11 w-11 self-center' : 'px-4 py-3'
          }`}
        >
          <Plus size={18} />
          {!iconOnly && 'New conversation'}
        </button>

        {/* Navigation */}
        {!iconOnly && (
          <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
            <span>Workspace</span>
            <button
              onClick={onToggleCollapsed}
              className="hidden rounded-md p-1 text-gray-500 hover:bg-white/10 hover:text-white md:block"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>
        )}

        <nav className="space-y-1.5">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = view === id
            return (
              <button
                key={id}
                onClick={() => onChangeView(id)}
                title={label}
                className={`flex w-full items-center gap-3 rounded-lg py-3 text-sm transition ${
                  iconOnly ? 'justify-center' : 'px-3'
                } ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={17} className="shrink-0" />
                {!iconOnly && <span className="truncate text-left">{label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Conversation history */}
        {!iconOnly && (
          <>
            <div className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Recent conversations
            </div>

            <div className="-mx-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1">
              {conversations.length === 0 ? (
                <p className="px-3 py-2 text-xs leading-5 text-gray-500">
                  Your conversations will appear here.
                </p>
              ) : (
                conversations.map((conversation) => {
                  const isActive = view === 'chat' && conversation.id === activeId
                  return (
                    <div
                      key={conversation.id}
                      className={`group flex items-center rounded-lg transition ${
                        isActive ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <button
                        onClick={() => onSelectConversation(conversation.id)}
                        className="min-w-0 flex-1 px-3 py-2 text-left"
                      >
                        <p className={`truncate text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                          {conversation.title}
                        </p>
                        <p className="text-[11px] text-gray-500">{timeAgo(conversation.updatedAt)}</p>
                      </button>

                      <button
                        onClick={() => onDeleteConversation(conversation.id)}
                        className="mr-1 rounded-md p-1.5 text-gray-500 opacity-100 transition hover:bg-white/10 hover:text-red-300 md:opacity-0 md:group-hover:opacity-100"
                        aria-label={`Delete conversation: ${conversation.title}`}
                        title="Delete conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* Live status + dataset summary */}
        <div className={`mt-auto border-t border-white/10 pt-5 ${iconOnly ? 'flex justify-center' : ''}`}>
          {iconOnly ? (
            <span
              className={`h-2.5 w-2.5 rounded-full ${status.dot}`}
              title={`Backend: ${status.label}`}
            />
          ) : (
            <div className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Knowledge base</p>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              <p className="mt-1.5 text-xs leading-5 text-gray-500">
                {stats
                  ? `${stats.total_listings} Wasalt listings in ${stats.cities.length} cities · ${stats.darglobal_pages} DarGlobal pages`
                  : 'DarGlobal & Wasalt public data'}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
