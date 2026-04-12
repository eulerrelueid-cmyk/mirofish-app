'use client'

import { SimulationAgent, SimulationEvent } from '@/types/simulation'

interface SimulationViewerProps {
  agents: SimulationAgent[]
  events: SimulationEvent[]
  isLoading: boolean
}

export function SimulationViewer({ agents, events, isLoading }: SimulationViewerProps) {
  // This component can be extended for additional visualizations
  return null
}
