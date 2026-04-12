'use client'

import { Fish } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-white/10 bg-miro-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-miro-accent to-miro-glow flex items-center justify-center">
            <Fish className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">MiroFish</h1>
            <p className="text-xs text-gray-400">Swarm Intelligence Visualizer</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-6">
          <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
            Documentation
          </a>
          <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
            GitHub
          </a>
          <a 
            href="https://github.com/666ghj/MiroFish" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-miro-accent/20 text-miro-accent text-sm font-medium hover:bg-miro-accent/30 transition-colors"
          >
            Original MiroFish
          </a>
        </nav>
      </div>
    </header>
  )
}
