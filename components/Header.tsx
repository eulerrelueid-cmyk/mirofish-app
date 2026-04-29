'use client'

import { useState } from 'react'
import { BookOpen, Fish, History, LayoutDashboard, Menu, X } from 'lucide-react'

type AppView = 'workspace' | 'history' | 'docs'

interface HeaderProps {
  activeView: AppView
  currentScenarioTitle?: string
  currentScenarioStatus?: string
  onNavigate: (view: AppView) => void
}

const navItems: Array<{
  id: AppView
  label: string
  icon: typeof LayoutDashboard
}> = [
  { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
  { id: 'history', label: 'History', icon: History },
  { id: 'docs', label: 'Guide', icon: BookOpen },
]

function formatStatusLabel(status?: string) {
  if (!status) {
    return 'Idle'
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function Header({ activeView, currentScenarioTitle, currentScenarioStatus, onNavigate }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleNavigate = (view: AppView) => {
    onNavigate(view)
    setMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111a]/78 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-gradient-to-br from-[#fff4d5] via-[#dcc592] to-[#a78b62] text-slate-950 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
              <Fish className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">MiroFish</h1>
              <p className="truncate text-sm text-slate-500">{currentScenarioTitle || 'Workspace'}</p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 lg:flex">
            <div className="rounded-full border border-white/10 bg-white/[0.04] p-1">
              {navItems.map(({ id, label, icon: Icon }) => {
                const isActive = activeView === id

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onNavigate(id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all ${
                      isActive
                        ? 'border border-white/10 bg-white/[0.12] text-white'
                        : 'border border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                )
              })}
            </div>
          </nav>

          <div className="flex items-center gap-3">
            {currentScenarioStatus && (
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 md:flex">
                <span className="h-2 w-2 rounded-full bg-miro-accent/80" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-300">{formatStatusLabel(currentScenarioStatus)}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/55"
            aria-label="Close menu overlay"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[360px] flex-col border-l border-white/10 bg-[#08131c] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">Menu</p>
                <p className="mt-1 text-lg font-semibold text-white">Sections</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {navItems.map(({ id, label, icon: Icon }) => {
                const isActive = activeView === id

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleNavigate(id)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                      isActive
                        ? 'border-white/[0.12] bg-white/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          isActive ? 'bg-white/10 text-white' : 'bg-black/20 text-slate-400'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-white">{label}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">Open run</p>
              <p className="mt-2 text-sm font-medium text-white">{currentScenarioTitle || 'No run open'}</p>
              <p className="mt-1 text-sm text-slate-400">{formatStatusLabel(currentScenarioStatus)}</p>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
