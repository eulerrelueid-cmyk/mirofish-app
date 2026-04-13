'use client'

import { useState } from 'react'
import { Fish, Menu, X, Github, BookOpen, ExternalLink } from 'lucide-react'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-b border-white/10 bg-miro-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-miro-accent to-miro-glow flex items-center justify-center shrink-0">
              <Fish className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg">MiroFish</h1>
              <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">Swarm Intelligence Visualizer</p>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              Docs
            </a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a 
              href="https://github.com/666ghj/MiroFish" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg bg-miro-accent/20 text-miro-accent text-sm font-medium hover:bg-miro-accent/30 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Original
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="md:hidden mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
            <a href="#" className="px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Documentation
            </a>
            <a href="#" className="px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a 
              href="https://github.com/666ghj/MiroFish" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-lg bg-miro-accent/20 text-miro-accent text-sm font-medium hover:bg-miro-accent/30 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Original MiroFish
            </a>
          </nav>
        )}
      </div>
    </header>
  )
}
