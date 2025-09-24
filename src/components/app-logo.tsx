import { GanttChartSquare } from 'lucide-react'

export function AppLogo() {
  return (
    <div className="flex items-center gap-2">
      <h1 className="text-xl font-bold text-foreground">PIFA</h1>
      <GanttChartSquare className="h-6 w-6 text-primary" />
    </div>
  )
}
