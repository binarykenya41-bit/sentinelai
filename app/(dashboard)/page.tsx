import { AppHeader } from "@/components/app-header"
import { SecurityScore } from "@/components/dashboard/security-score"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { ExploitTimeline } from "@/components/dashboard/exploit-timeline"
import { RecentAlerts } from "@/components/dashboard/recent-alerts"

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Dashboard" />
      <div className="flex flex-col gap-6 p-6">
        <SecurityScore />
        <KpiCards />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ExploitTimeline />
          </div>
          <div className="lg:col-span-2">
            <RecentAlerts />
          </div>
        </div>
      </div>
    </div>
  )
}
