'use client'

import { useEffect, useRef, useState } from 'react'
import { SimulationAgent, SimulationEvent } from '@/types/simulation'
import { ZoomIn, ZoomOut, RotateCcw, Users, Maximize2 } from 'lucide-react'

interface AgentNetworkProps {
  agents: SimulationAgent[]
  events: SimulationEvent[]
  isLoading: boolean
}

export function AgentNetwork({ agents, events, isLoading }: AgentNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [selectedAgent, setSelectedAgent] = useState<SimulationAgent | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const touchStartDist = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || agents.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    resizeCanvas()

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.9)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      agents.forEach((agent) => {
        agent.connections.forEach((connId) => {
          const target = agents.find((a) => a.id === connId)
          if (target) {
            ctx.beginPath()
            ctx.moveTo((agent.x + offset.x) * scale + canvas.width / 2 - 400 * scale, (agent.y + offset.y) * scale + canvas.height / 2 - 300 * scale)
            ctx.lineTo((target.x + offset.x) * scale + canvas.width / 2 - 400 * scale, (target.y + offset.y) * scale + canvas.height / 2 - 300 * scale)
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)'
            ctx.lineWidth = 1 * scale
            ctx.stroke()
          }
        })
      })

      // Draw agents
      agents.forEach((agent) => {
        const x = (agent.x + offset.x) * scale + canvas.width / 2 - 400 * scale
        const y = (agent.y + offset.y) * scale + canvas.height / 2 - 300 * scale
        const radius = (8 + agent.influence * 8) * scale

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2)
        if (agent.sentiment > 0) {
          gradient.addColorStop(0, 'rgba(20, 184, 166, 0.8)')
          gradient.addColorStop(1, 'rgba(20, 184, 166, 0)')
        } else if (agent.sentiment < 0) {
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)')
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0)')
        } else {
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)')
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0)')
        }

        ctx.beginPath()
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = agent.sentiment > 0 ? '#14b8a6' : agent.sentiment < 0 ? '#f59e0b' : '#6366f1'
        ctx.fill()

        if (selectedAgent?.id === agent.id) {
          ctx.beginPath()
          ctx.arc(x, y, radius + 4, 0, Math.PI * 2)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })
    }

    draw()
    const handleResize = () => { resizeCanvas(); draw() }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [agents, scale, offset, selectedAgent])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const clickedAgent = agents.find((agent) => {
      const x = (agent.x + offset.x) * scale + canvas.width / 2 - 400 * scale
      const y = (agent.y + offset.y) * scale + canvas.height / 2 - 300 * scale
      const radius = (8 + agent.influence * 8) * scale
      return Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2) <= radius + 10
    })

    setSelectedAgent(clickedAgent || null)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      touchStartDist.current = dist
    } else if (e.touches.length === 1) {
      setIsDragging(true)
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2 && touchStartDist.current > 0) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      const newScale = Math.min(Math.max(scale * (dist / touchStartDist.current), 0.5), 3)
      setScale(newScale)
      touchStartDist.current = dist
    } else if (isDragging && e.touches.length === 1) {
      const dx = (e.touches[0].clientX - dragStart.current.x) / scale
      const dy = (e.touches[0].clientY - dragStart.current.y) / scale
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    touchStartDist.current = 0
  }

  return (
    <div className="glass-panel rounded-xl sm:rounded-2xl p-3 sm:p-4 glow-border">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-miro-accent" />
          <h3 className="font-semibold text-sm sm:text-base">Agent Network</h3>
          <span className="text-xs sm:text-sm text-gray-400">({agents.length})</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => setScale((s) => Math.min(s * 1.2, 3))} className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setScale((s) => Math.max(s / 1.2, 0.5))} className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] rounded-lg sm:rounded-xl overflow-hidden bg-miro-dark">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full border-4 border-miro-accent/30 border-t-miro-accent animate-spin" />
              <p className="text-gray-400 text-sm">Spawning agents...</p>
            </div>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full h-full cursor-move touch-none"
            />
            
            {/* Mobile instruction */}
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 glass-panel rounded-md sm:rounded-lg px-2 py-1 sm:px-3 sm:py-2 text-xs text-gray-400 hidden sm:block">
              <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Pinch to zoom, drag to pan
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 glass-panel rounded-md sm:rounded-lg px-2 py-1.5 sm:p-3 text-xs">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-miro-teal" />
                  <span className="text-gray-400 text-xs">Positive</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-miro-amber" />
                  <span className="text-gray-400 text-xs">Negative</span>
                </div>
              </div>
            </div>

            {/* Selected Agent Info - Mobile optimized */}
            {selectedAgent && (
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 glass-panel rounded-lg p-3 sm:p-4 w-48 sm:w-64">
                <h4 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 truncate">{selectedAgent.name}</h4>
                <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                  <p className="text-gray-400">Role: <span className="text-white">{selectedAgent.role}</span></p>
                  <p className="text-gray-400">Sentiment: <span className={selectedAgent.sentiment > 0 ? 'text-miro-teal' : 'text-miro-amber'}>{(selectedAgent.sentiment * 100).toFixed(0)}%</span></p>
                  <p className="text-gray-400">Influence: <span className="text-white">{(selectedAgent.influence * 100).toFixed(0)}%</span></p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
