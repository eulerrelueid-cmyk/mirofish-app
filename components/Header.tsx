'use client'

import { useState } from 'react'
import { BookOpen, ExternalLink, Fish, Github, History, LayoutDashboard, Menu, X } from 'lucide-react'

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
  description: string
  icon: typeof LayoutDashboard
}> = [
  {
    id: 'workspace',
    label: 'Workspace',
    description: 'Run or inspect simulations',
    icon: LayoutDashboard,
  },
  {
    id: 'history',
    label: 'Historic runs',
    description: 'Browse previous simulations',
    icon: History,
  },
  {
    id: 'docs',
    label: 'How to use it',
    description: 'User guidance and tips',
    icon: BookOpen,
  },
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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111a]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-miro-accent via-miro-teal to-miro-glow text-slate-950 shadow-[0_14px_30px_rgba(95,197,255,0.18)]">
              <Fish className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">MiroFish</h1>
              <p className="truncate text-sm text-slate-400">
                {currentScenarioTitle || 'Scenario simulation workspace'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-300 sm:inline-flex">
              {formatStatusLabel(currentScenarioStatus)}
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10"
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
                <p className="mt-1 text-lg font-semibold text-white">Navigate the app</p>
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
              {navItems.map(({ id, label, description, icon: Icon }) => {
                const isActive = activeView === id

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleNavigate(id)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                      isActive
                        ? 'border-miro-accent/35 bg-miro-accent/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isActive ? 'bg-miro-accent/15 text-miro-accent' : 'bg-black/20 text-slate-400'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{label}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">Current run</p>
              <p className="mt-2 text-sm font-medium text-white">{currentScenarioTitle || 'No run selected'}</p>
              <p className="mt-1 text-sm text-slate-400">{formatStatusLabel(currentScenarioStatus)}</p>
            </div>

            <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
              <a
                href="https://github.com/eulerrelueid-cmyk/mirofish-app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                App repository
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/666ghj/MiroFish"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                Original project
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
