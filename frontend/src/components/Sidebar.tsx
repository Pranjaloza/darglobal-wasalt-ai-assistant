import {
  Building2,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  PanelLeftClose,
} from 'lucide-react'

interface SidebarProps {
  onNewChat: () => void
}

function Sidebar({ onNewChat }: SidebarProps) {
  return (
    <aside className="flex h-screen w-[270px] shrink-0 flex-col bg-[#111827] px-5 py-6 text-white">

      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C6A66B]">
          <Building2 size={22} className="text-[#111827]" />
        </div>

        <div>
          <h1 className="font-bold tracking-wide">ESTATE INTELLIGENCE</h1>
          <p className="text-[10px] tracking-[2px] text-gray-400">
            AI REAL ESTATE ASSISTANT
          </p>
        </div>
      </div>

      <button
        onClick={onNewChat}
        className="mb-8 flex items-center justify-center gap-2 rounded-xl bg-[#C6A66B] px-4 py-3 font-semibold text-[#111827] transition hover:bg-[#d6b980]"
      >
        <Plus size={18} />
        New conversation
      </button>

      <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
        <span>Workspace</span>
        <PanelLeftClose size={15} />
      </div>

      <nav className="space-y-2">
        <button className="flex w-full items-center gap-3 rounded-lg bg-white/10 px-3 py-3 text-sm text-white">
          <MessageSquare size={17} />
          AI Assistant
        </button>

        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
          <Search size={17} />
          Property discovery
        </button>
      </nav>

      <div className="mb-3 mt-10 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Recent conversations
      </div>

      <div className="space-y-1">
        {[
          'Villas in Madinah',
          'DarGlobal projects',
          'Properties under 2M SAR',
        ].map((item) => (
          <button
            key={item}
            className="w-full truncate rounded-lg px-3 py-2.5 text-left text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C6A66B]/20">
            <Sparkles size={18} className="text-[#C6A66B]" />
          </div>

          <div>
            <p className="text-sm font-semibold">AI Powered</p>
            <p className="text-xs text-gray-500">Real estate intelligence</p>
          </div>
        </div>

        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white">
          <Settings size={17} />
          Settings
        </button>
      </div>
    </aside>
  )
}

export default Sidebar