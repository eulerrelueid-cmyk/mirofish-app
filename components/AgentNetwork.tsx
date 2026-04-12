'use client'

import { useEffect, useRef, useState } from 'react'
import { SimulationAgent, SimulationEvent } from '@/types/simulation'
import { ZoomIn, ZoomOut, RotateCcw, Users } from 'lucide-react'

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
            ctx.moveTo(
              (agent.x + offset.x) * scale + canvas.width / 2 - 400 * scale,
              (agent.y + offset.y) * scale + canvas.height / 2 - 300 * scale
            )
            ctx.lineTo(
              (target.x + offset.x) * scale + canvas.width / 2 - 400 * scale,
              (target.y + offset.y) * scale + canvas.height / 2 - 300 * scale
            )
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

        // Glow effect
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

        // Agent circle
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        if (agent.sentiment > 0) {
          ctx.fillStyle = '#14b8a6'
        } else if (agent.sentiment < 0) {
          ctx.fillStyle = '#f59e0b'
        } else {
          ctx.fillStyle = '#6366f1'
        }
        ctx.fill()

        // Selection ring
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

    const handleResize = () => {
      resizeCanvas()
      draw()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [agents, scale, offset, selectedAgent])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Find clicked agent
    const clickedAgent = agents.find((agent) => {
      const x = (agent.x + offset.x) * scale + canvas.width / 2 - 400 * scale
      const y = (agent.y + offset.y) * scale + canvas.height / 2 - 300 * scale
      const radius = (8 + agent.influence * 8) * scale
      const dist = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2)
      return dist <= radius
    })

    setSelectedAgent(clickedAgent || null)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = (e.clientX - dragStart.current.x) / scale
    const dy = (e.clientY - dragStart.current.y) / scale
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
    dragStart.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="glass-panel rounded-2xl p-4 glow-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-miro-accent" />
          <h3 className="font-semibold">Agent Network</h3>
          <span className="text-sm text-gray-400">({agents.length} agents)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.min(s * 1.2, 3))}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s / 1.2, 0.5))}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative h-[500px] rounded-xl overflow-hidden bg-miro-dark">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-miro-accent/30 border-t-miro-accent animate-spin" />
              <p className="text-gray-400">Spawning agents...</p>
            </div>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full cursor-move"
            />
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 glass-panel rounded-lg p-3 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-miro-teal" />
                  <span className="text-gray-400">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-miro-amber" />
                  <span className="text-gray-400">Negative</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-miro-accent" />
                  <span className="text-gray-400">Neutral</span>
                </div>
              </div>
            </div>

            {/* Selected Agent Info */}
            {selectedAgent && (
              <div className="absolute top-4 right-4 glass-panel rounded-lg p-4 w-64">
                <h4 className="font-semibold mb-2">{selectedAgent.name}</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">Role: <span className="text-white">{selectedAgent.role}</span></p>
                  <p className="text-gray-400">Personality: <span className="text-white">{selectedAgent.personality}</span></p>
                  <p className="text-gray-400">Sentiment: <span className={selectedAgent.sentiment > 0 ? 'text-miro-teal' : 'text-miro-amber'}>
                    {(selectedAgent.sentiment * 100).toFixed(0)}%
                  </span></p>
                  <p className="text-gray-400">Influence: <span className="text-white">{(selectedAgent.influence * 100).toFixed(0)}%</span></p>
                  <p className="text-gray-400">State: <span className="text-white capitalize">{selectedAgent.state}</span></p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
