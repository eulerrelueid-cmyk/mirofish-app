'use client'

import { useMemo, useState } from 'react'
import { GitBranch, Info, Maximize2 } from 'lucide-react'

import type { DecisionGraphModel, DecisionGraphNode } from '@/lib/decision-intelligence'

interface DecisionGraphProps {
  graph: DecisionGraphModel
}

const nodeColors: Record<DecisionGraphNode['type'], string> = {
  scenario: '#f4d06f',
  platform: '#6ea8fe',
  focus: '#7dd3c7',
  agent: '#e5e7eb',
  event: '#fb7185',
  cohort: '#a78bfa',
}

const edgeColors = {
  neutral: 'rgba(148, 163, 184, 0.38)',
  supportive: 'rgba(125, 211, 199, 0.58)',
  critical: 'rgba(251, 113, 133, 0.58)',
  signal: 'rgba(244, 208, 111, 0.55)',
}

function sentimentLabel(value: number) {
  if (value > 0.25) {
    return 'supportive'
  }

  if (value < -0.25) {
    return 'critical'
  }

  return 'neutral'
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function DecisionGraph({ graph }: DecisionGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState(graph.nodes[0]?.id)

  const selectedNode = useMemo(
    () => graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0],
    [graph.nodes, selectedNodeId]
  )
  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes])

  return (
    <section className="df-panel min-h-[520px] overflow-hidden">
      <div className="df-panel-header">
        <div>
          <p className="df-kicker">Reality map</p>
          <h2 className="df-panel-title">Stakeholder influence graph</h2>
        </div>
        <div className="df-icon-box">
          <GitBranch className="h-4 w-4" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative min-h-[390px] overflow-hidden rounded-lg border border-white/10 bg-[#071019]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-label="Decision graph">
            <defs>
              <pattern id="decision-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="0.35" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#decision-grid)" />

            {graph.edges.map((edge) => {
              const source = nodeById.get(edge.source)
              const target = nodeById.get(edge.target)
              if (!source || !target) {
                return null
              }

              return (
                <g key={edge.id}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={edgeColors[edge.tone]}
                    strokeWidth={Math.max(0.45, edge.strength * 1.65)}
                    strokeLinecap="round"
                  />
                </g>
              )
            })}

            {graph.nodes.map((node) => {
              const isSelected = node.id === selectedNode?.id
              const fill = node.type === 'agent'
                ? node.sentiment > 0.25
                  ? '#7dd3c7'
                  : node.sentiment < -0.25
                    ? '#fb7185'
                    : '#e5e7eb'
                : nodeColors[node.type]

              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${node.label}`}
                  onClick={() => setSelectedNodeId(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setSelectedNodeId(node.id)
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius / 2}
                    fill={fill}
                    opacity={node.type === 'scenario' ? 0.95 : 0.86}
                    stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.42)'}
                    strokeWidth={isSelected ? 1.4 : 0.45}
                  />
                  <text
                    x={node.x}
                    y={node.y + node.radius / 2 + 3.2}
                    textAnchor="middle"
                    className="fill-slate-300 text-[2.2px]"
                  >
                    {node.label.length > 14 ? `${node.label.slice(0, 13)}...` : node.label}
                  </text>
                </g>
              )
            })}
          </svg>

          <div className="absolute left-3 top-3 rounded-md border border-white/10 bg-black/55 px-3 py-2 text-xs text-slate-300 backdrop-blur">
            {graph.nodes.length} nodes / {graph.edges.length} links
          </div>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-md border border-white/10 bg-black/55 p-2 backdrop-blur">
            {graph.legend.map((item) => (
              <span key={item.type} className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ background: nodeColors[item.type] }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <aside className="df-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="df-kicker">Selected node</p>
            <Maximize2 className="h-4 w-4 text-slate-500" />
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-white">{selectedNode.label}</p>
                <p className="mt-1 text-sm capitalize text-slate-400">{selectedNode.type}</p>
              </div>

              <p className="text-sm leading-6 text-slate-300">{selectedNode.detail}</p>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-white/10 bg-black/20 p-3">
                  <p className="df-kicker">Sentiment</p>
                  <p className="mt-2 text-sm font-semibold capitalize text-white">{sentimentLabel(selectedNode.sentiment)}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-black/20 p-3">
                  <p className="df-kicker">Influence</p>
                  <p className="mt-2 text-sm font-semibold text-white">{formatPercent(selectedNode.influence)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center text-center text-sm text-slate-500">
              <div>
                <Info className="mx-auto mb-2 h-5 w-5" />
                Select a node for details.
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
