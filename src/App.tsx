import { mockMissionData } from './data/mockMissionData'
import { Explorer } from './features/explorer/Explorer'
import { useSimulation } from './hooks/useSimulation'

function App() {
  const simulation = useSimulation(mockMissionData)
  return <Explorer analyses={mockMissionData} simulation={simulation} />
}

export default App
