import type { SimulationProject, SimulationScenario } from '../types/simulation'

export interface ProjectWorkflowStep {
  id: 'input' | 'world' | 'simulation' | 'report'
  label: string
  status: 'complete' | 'current' | 'upcoming'
}

export function buildProjectWorkflow(
  project?: SimulationProject,
  scenario?: SimulationScenario | null
): ProjectWorkflowStep[] {
  const hasInput = Boolean(scenario?.title || scenario?.description)
  const hasWorld = Boolean(scenario?.results?.brief || project?.focusAreas.length || project?.sourceReference)
  const simulationComplete = scenario?.status === 'completed'
  const simulationCurrent = scenario?.status === 'running' || project?.status === 'simulation_running'
  const hasReport = Boolean(scenario?.results?.report || project?.reportSnapshot)

  return [
    {
      id: 'input',
      label: 'Input',
      status: hasInput ? 'complete' : 'upcoming',
    },
    {
      id: 'world',
      label: 'World',
      status: hasWorld ? 'complete' : hasInput ? 'current' : 'upcoming',
    },
    {
      id: 'simulation',
      label: 'Simulation',
      status: simulationComplete ? 'complete' : simulationCurrent ? 'current' : hasWorld ? 'upcoming' : 'upcoming',
    },
    {
      id: 'report',
      label: 'Report',
      status: hasReport ? 'complete' : simulationComplete ? 'current' : 'upcoming',
    },
  ]
}
