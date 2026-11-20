import { LayoutDashboard, List, PanelLeftClose, PanelLeftOpen, Plus, Trash2, X } from 'lucide-react'
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
  online: { dot: 'bg-[#7fbf8f]', label: 'Connected' },
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
    groups[time >= today ? 0 : time >= weekAgo ? 1 : 2].items.push(conversation)
  }

  return groups.filter((group) => group.items.length > 0)
}

/*
 * Layout rule: the sidebar has 12px side padding and every row inside it has
 * 12px inner padding, so all icons, labels and history titles start on the
 * same vertical line (24px from the edge).
 */
const ROW = 'flex w-full items-center gap-3 rounded-md px-3'

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
    { id: 'chat', label: 'Overview & chat', icon: LayoutDashboard },
    { id: 'discovery', label: 'Listings', icon: List },
  ]
  const status = STATUS[apiStatus]
  const iconOnly = collapsed && !mobileOpen

  return (
    <>
      <div
        onClick={onCloseMobile}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col bg-nav px-3 text-nav-text transition-[width,transform] duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${iconOnly ? 'w-16' : 'w-64'}`}
      >
        {/* Brand row: same 56px height as the page header */}
        <div className={`flex h-14 shrink-0 items-center border-b border-nav-line ${iconOnly ? 'justify-center' : 'gap-3 px-3'}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gold text-[13px] font-bold text-nav">
            DW
          </span>
          {!iconOnly && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-white">DarGlobal · Wasalt</p>
              <p className="truncate text-xs text-nav-muted">Property assistant</p>
            </div>
          )}
          <button
            onClick={onCloseMobile}
            className="rounded-sm p-1 text-nav-muted hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
        </div>

        {/* Primary action */}
        <div className="pt-4">
          <button
            onClick={onNewChat}
            title="New question"
            className={`flex h-9 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-medium text-white hover:bg-accent-hover`}
          >
            <Plus size={16} />
            {!iconOnly && 'New question'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 space-y-0.5">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = view === id
            return (
              <button
                key={id}
                onClick={() => onChangeView(id)}
                title={label}
                className={`${ROW} h-9 text-sm ${iconOnly ? 'justify-center px-0' : ''} ${
                  active ? 'bg-nav-active font-medium text-white' : 'text-nav-text hover:bg-nav-hover'
                }`}
              >
                <Icon size={16} className={`shrink-0 ${active ? 'text-gold' : 'text-nav-muted'}`} />
                {!iconOnly && <span className="flex-1 truncate text-left">{label}</span>}
                {!iconOnly && id === 'discovery' && stats && (
                  <span className="tabular text-xs text-nav-faint">{stats.total_listings}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* History */}
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto border-t border-nav-line pt-4">
          {!iconOnly && (
            <>
              <p className="px-3 pb-2 text-xs font-medium text-nav-muted">Recent questions</p>
              {conversations.length === 0 ? (
                <p className="px-3 text-xs leading-5 text-nav-faint">
                  Questions you ask are saved here, in this browser only.
                </p>
              ) : (
                groupByDate(conversations).map((group) => (
                  <div key={group.label} className="mb-3">
                    <p className="px-3 pb-1 text-[11px] text-nav-faint">{group.label}</p>
                    {group.items.map((conversation) => {
                      const active = view === 'chat' && conversation.id === activeId
                      return (
                        <div
                          key={conversation.id}
                          className={`group flex items-center rounded-md ${active ? 'bg-nav-active' : 'hover:bg-nav-hover'}`}
                        >
                          <button
                            onClick={() => onSelectConversation(conversation.id)}
                            title={conversation.title}
                            className={`min-w-0 flex-1 truncate py-1.5 pl-3 text-left text-sm ${
                              active ? 'text-white' : 'text-nav-text'
                            }`}
                          >
                            {conversation.title}
                          </button>
                          <button
                            onClick={() => onDeleteConversation(conversation.id)}
                            className="mr-1.5 rounded-sm p-1 text-nav-faint hover:text-[#f0a58c] md:invisible md:group-hover:visible"
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex shrink-0 items-center border-t border-nav-line py-3 ${iconOnly ? 'flex-col gap-3' : 'gap-3 px-3'}`}>
          <span className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`} title={status.label} />
          {!iconOnly && (
            <p className="tabular min-w-0 flex-1 truncate text-xs text-nav-muted">
              {status.label}
              {stats ? ` · ${stats.total_listings} listings` : ''}
            </p>
          )}
          <button
            onClick={onToggleCollapsed}
            className="hidden rounded-sm p-1 text-nav-muted hover:bg-nav-hover hover:text-white md:block"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
