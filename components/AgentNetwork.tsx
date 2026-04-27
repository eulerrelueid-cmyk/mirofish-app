'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { SimulationAgent, SimulationEvent } from '@/types/simulation'
import { ZoomIn, ZoomOut, RotateCcw, Users, Maximize2 } from 'lucide-react'

interface AgentNetworkProps {
  agents: SimulationAgent[]
  events: SimulationEvent[]
  isLoading: boolean
}

export function AgentNetwork({ agents, events, isLoading }: AgentNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const layoutRef = useRef<Map<string, { agent: SimulationAgent; x: number; y: number; radius: number }>>(new Map())
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [selectedAgent, setSelectedAgent] = useState<SimulationAgent | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const touchStartDist = useRef(0)
  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents])

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

      const layout = new Map<string, { agent: SimulationAgent; x: number; y: number; radius: number }>()

      agents.forEach((agent) => {
        layout.set(agent.id, {
          agent,
          x: (agent.x + offset.x) * scale + canvas.width / 2 - 400 * scale,
          y: (agent.y + offset.y) * scale + canvas.height / 2 - 300 * scale,
          radius: (8 + agent.influence * 8) * scale,
        })
      })

      layoutRef.current = layout

      agents.forEach((agent) => {
        const source = layout.get(agent.id)
        if (!source) {
          return
        }

        agent.connections.forEach((connId) => {
          const target = layout.get(connId)
          if (target) {
            ctx.beginPath()
            ctx.moveTo(source.x, source.y)
            ctx.lineTo(target.x, target.y)
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)'
            ctx.lineWidth = Math.max(1, scale)
            ctx.stroke()
          }
        })
      })

      agents.forEach((agent) => {
        const node = layout.get(agent.id)
        if (!node) {
          return
        }

        const { x, y, radius } = node

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

    const clickedAgent = Array.from(layoutRef.current.values()).find(({ x, y, radius }) => (
      Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2) <= radius + 10
    ))

    setSelectedAgent(clickedAgent ? agentById.get(clickedAgent.agent.id) || clickedAgent.agent : null)
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
    <div className="glass-panel rounded-[28px] p-4 sm:p-5 glow-border">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-miro-accent/10">
            <Users className="h-5 w-5 text-miro-accent" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Agent network</h3>
            <p className="text-xs text-slate-500">{agents.length} nodes · {events.length} observed events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale((s) => Math.min(s * 1.2, 3))} className="rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => setScale((s) => Math.max(s / 1.2, 0.5))} className="rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} className="rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative h-[320px] sm:h-[420px] md:h-[520px] overflow-hidden rounded-[24px] border border-white/10 bg-miro-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(114,224,197,0.14),transparent_30%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:auto,42px_42px,42px_42px]" />
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full border-4 border-miro-accent/30 border-t-miro-accent animate-spin" />
              <p className="text-sm text-slate-400">Spawning agents...</p>
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
            <div className="absolute bottom-3 left-3 hidden rounded-full border border-white/10 bg-[#091722]/85 px-3 py-2 text-xs text-slate-400 sm:block">
              <Maximize2 className="mr-1 inline h-4 w-4" />
              Pinch to zoom, drag to pan
            </div>

            <div className="absolute bottom-3 right-3 rounded-[20px] border border-white/10 bg-[#091722]/85 px-3 py-2 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-miro-teal" />
                  <span className="text-slate-400">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-miro-amber" />
                  <span className="text-slate-400">Negative</span>
                </div>
              </div>
            </div>

            {selectedAgent && (
              <div className="absolute right-3 top-3 w-52 rounded-[22px] border border-white/10 bg-[#091722]/90 p-4 sm:right-4 sm:top-4 sm:w-64">
                <h4 className="mb-2 truncate text-sm font-semibold text-white sm:text-base">{selectedAgent.name}</h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="text-slate-400">Role: <span className="text-white">{selectedAgent.role}</span></p>
                  <p className="text-slate-400">
                    Sentiment:{' '}
                    <span className={selectedAgent.sentiment > 0 ? 'text-miro-teal' : 'text-miro-amber'}>
                      {(selectedAgent.sentiment * 100).toFixed(0)}%
                    </span>
                  </p>
                  <p className="text-slate-400">Influence: <span className="text-white">{(selectedAgent.influence * 100).toFixed(0)}%</span></p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
