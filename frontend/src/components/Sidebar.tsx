import { List, MessageSquareText, PanelLeftClose, PanelLeftOpen, Plus, Trash2, X } from 'lucide-react'
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

const STATUS: Record<ApiStatus, { dot: string; label: string }> = {
  checking: { dot: 'bg-warn', label: 'Connecting' },
  online: { dot: 'bg-[#5fae8f]', label: 'Connected' },
  offline: { dot: 'bg-danger', label: 'Offline' },
}

function groupByDate(conversations: Conversation[]) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const today = startOfToday.getTime()
  const weekAgo = today - 6 * 86_400_000

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Previous 7 days', items: [] },
    { label: 'Older', items: [] },
  ]

  for (const conversation of conversations) {
    const time = new Date(conversation.updatedAt).getTime()
    const index = time >= today ? 0 : time >= weekAgo ? 1 : 2
    groups[index].items.push(conversation)
  }

  return groups.filter((group) => group.items.length > 0)
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
  const navItems: { id: View; label: string; icon: typeof List }[] = [
    { id: 'chat', label: 'Ask', icon: MessageSquareText },
    { id: 'discovery', label: 'Listings', icon: List },
  ]
  const status = STATUS[apiStatus]
  const iconOnly = collapsed && !mobileOpen

  return (
    <>
      <div
        onClick={onCloseMobile}
        className={`fixed inset-0 z-30 bg-ink/30 transition-opacity md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col bg-nav text-nav-text transition-[width,transform] duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${iconOnly ? 'w-14' : 'w-64'}`}
      >
        {/* Header */}
        <div className={`flex h-14 shrink-0 items-center border-b border-nav-line ${iconOnly ? 'justify-center' : 'justify-between px-4'}`}>
          {!iconOnly && (
            <div className="min-w-0 leading-tight">
              <p className="font-display text-lg font-semibold leading-none tracking-wide text-white">DarGlobal · Wasalt</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gold">Property research</p>
            </div>
          )}

          <button
            onClick={onCloseMobile}
            className="rounded-sm p-1.5 text-nav-muted hover:bg-nav-hover hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
          <button
            onClick={onToggleCollapsed}
            className="hidden rounded-sm p-1.5 text-nav-muted hover:bg-nav-hover hover:text-white md:block"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`shrink-0 space-y-0.5 pt-3 ${iconOnly ? 'px-2' : 'px-3'}`}>
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = view === id
            return (
              <button
                key={id}
                onClick={() => onChangeView(id)}
                title={label}
                className={`flex w-full items-center gap-2.5 rounded-md py-1.5 text-sm ${
                  iconOnly ? 'justify-center' : 'px-2.5'
                } ${active ? 'bg-nav-active font-medium text-white' : 'text-nav-text hover:bg-nav-hover'}`}
              >
                <Icon size={16} className={`shrink-0 ${active ? 'text-gold' : 'text-nav-muted'}`} />
                {!iconOnly && label}
                {!iconOnly && id === 'discovery' && stats && (
                  <span className="tabular ml-auto text-xs text-nav-faint">{stats.total_listings}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* History */}
        {!iconOnly ? (
          <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-nav-line">
            <div className="flex items-center justify-between px-4 pb-1 pt-3">
              <span className="text-xs font-medium text-nav-muted">History</span>
              <button
                onClick={onNewChat}
                className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs text-gold hover:bg-nav-hover"
              >
                <Plus size={13} />
                New
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              {conversations.length === 0 ? (
                <p className="px-2.5 py-2 text-xs leading-5 text-nav-faint">
                  Questions you ask are kept here, in this browser only.
                </p>
              ) : (
                groupByDate(conversations).map((group) => (
                  <div key={group.label} className="mt-2">
                    <p className="px-2.5 pb-1 text-[11px] uppercase tracking-wide text-nav-faint">{group.label}</p>
                    {group.items.map((conversation) => {
                      const active = view === 'chat' && conversation.id === activeId
                      return (
                        <div
                          key={conversation.id}
                          className={`group flex items-center rounded-md ${
                            active ? 'bg-nav-active' : 'hover:bg-nav-hover'
                          }`}
                        >
                          <button
                            onClick={() => onSelectConversation(conversation.id)}
                            title={conversation.title}
                            className={`min-w-0 flex-1 truncate px-2.5 py-1.5 text-left text-sm ${
                              active ? 'text-white' : 'text-nav-text'
                            }`}
                          >
                            {conversation.title}
                          </button>
                          <button
                            onClick={() => onDeleteConversation(conversation.id)}
                            className="mr-1 rounded-sm p-1 text-nav-faint hover:text-[#f2a7a7] md:invisible md:group-hover:visible"
                            aria-label={`Delete: ${conversation.title}`}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 justify-center pt-3">
            <button
              onClick={onNewChat}
              className="h-8 w-8 rounded-md text-nav-muted hover:bg-nav-hover hover:text-white"
              aria-label="New question"
              title="New question"
            >
              <Plus size={16} className="mx-auto" />
            </button>
          </div>
        )}

        {/* Footer: data source + connection */}
        <div className={`shrink-0 border-t border-nav-line py-3 text-xs ${iconOnly ? 'flex justify-center' : 'px-4'}`}>
          {iconOnly ? (
            <span className={`h-2 w-2 rounded-full ${status.dot}`} title={status.label} />
          ) : (
            <>
              <p className="tabular leading-5 text-nav-muted">
                {stats
                  ? `${stats.total_listings} Wasalt listings · ${stats.darglobal_pages} DarGlobal pages`
                  : 'DarGlobal and Wasalt public data'}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-nav-faint">
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </p>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
