import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, MousePointerClick, Users, AlertTriangle, Clock, BarChart3 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const campaign = {
  id: "PH-2026-07",
  name: "IT Password Reset Lure",
  template: "Corporate IT",
  type: "Mass Phishing",
  status: "Completed",
  date: "2026-03-01",
  operator: "a.chen",
  target: "All Staff",
  totalTargets: 284,
  sent: 284,
  opened: 201,
  clicked: 72,
  submitted: 18,
  reported: 34,
  unengaged: 160,
  objective: "Measure phishing susceptibility across all departments and identify high-risk users requiring mandatory awareness training.",
  subject: "[ACTION REQUIRED] Reset Your Corporate Password — IT Security Team",
  sender: "it-security@corp-it-support.com (spoofed)",
  lander: "https://corp-password-reset.internal.xyz (harvests credentials)",
}

const departmentBreakdown = [
  { dept: "Finance", targets: 22, clicked: 12, submitted: 7, reported: 1 },
  { dept: "Executive", targets: 8, clicked: 3, submitted: 2, reported: 0 },
  { dept: "HR", targets: 14, clicked: 6, submitted: 3, reported: 2 },
  { dept: "Engineering", targets: 48, clicked: 10, submitted: 2, reported: 14 },
  { dept: "Sales", targets: 62, clicked: 18, submitted: 3, reported: 9 },
  { dept: "IT", targets: 18, clicked: 2, submitted: 0, reported: 8 },
  { dept: "Operations", targets: 112, clicked: 21, submitted: 1, reported: 0 },
]

const highRiskUsers = [
  { user: "c.brooks@corp.io", dept: "Finance", action: "Credentials Submitted", time: "09:12 UTC" },
  { user: "r.hall@corp.io", dept: "Finance", action: "Credentials Submitted", time: "09:18 UTC" },
  { user: "p.hill@corp.io", dept: "Executive", action: "Clicked Link", time: "09:45 UTC" },
  { user: "s.james@corp.io", dept: "HR", action: "Credentials Submitted", time: "10:12 UTC" },
  { user: "t.martin@corp.io", dept: "HR", action: "Clicked Link", time: "10:38 UTC" },
]

const timeline = [
  { time: "08:00 UTC", event: "Campaign launched — 284 emails sent via SendGrid simulation engine" },
  { time: "08:04 UTC", event: "First open recorded — Finance team member" },
  { time: "08:07 UTC", event: "First credential submission — c.brooks@corp.io" },
  { time: "08:30 UTC", event: "Peak click period — 42 clicks in 30 minutes" },
  { time: "12:00 UTC", event: "Awareness email sent to all clickers with training link" },
  { time: "18:00 UTC", event: "Campaign closed — final results compiled" },
]

const clickRate = Math.round((campaign.clicked / campaign.sent) * 100)
const submitRate = Math.round((campaign.submitted / campaign.sent) * 100)
const reportRate = Math.round((campaign.reported / campaign.sent) * 100)

export default function PhishingCampaignDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col">
      <AppHeader title={`Campaign — ${campaign.id}`} />
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-card-foreground">{campaign.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Launched {campaign.date} · Operator: {campaign.operator} · Template: {campaign.template}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">{campaign.status}</Badge>
                <Badge variant="outline" className="border-border text-muted-foreground">{campaign.type}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Subject Line</p>
                <p className="text-card-foreground font-mono text-[11px]">{campaign.subject}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Sender (Spoofed)</p>
                <p className="text-destructive font-mono text-[11px]">{campaign.sender}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Landing Page</p>
                <p className="text-warning font-mono text-[11px]">{campaign.lander}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Objective</p>
              <p className="text-xs text-card-foreground">{campaign.objective}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-4">
          {[
            { label: "Sent", value: campaign.sent, color: "text-card-foreground" },
            { label: "Opened", value: campaign.opened, color: "text-primary" },
            { label: "Clicked", value: campaign.clicked, color: "text-warning" },
            { label: "Creds Submitted", value: campaign.submitted, color: "text-destructive" },
            { label: "Reported", value: campaign.reported, color: "text-success" },
            { label: "Click Rate", value: `${clickRate}%`, color: "text-warning" },
          ].map(stat => (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="p-4">
                <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Department Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4">
              {departmentBreakdown.map((d) => {
                const dClickRate = Math.round((d.clicked / d.targets) * 100)
                return (
                  <div key={d.dept} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-card-foreground">{d.dept} <span className="text-muted-foreground font-normal">({d.targets})</span></span>
                      <div className="flex gap-3 text-[10px]">
                        <span className="text-warning">{d.clicked} clicked</span>
                        <span className="text-destructive">{d.submitted} submitted</span>
                        <span className="text-success">{d.reported} reported</span>
                      </div>
                    </div>
                    <Progress value={dClickRate} className="h-1 bg-secondary [&>div]:bg-warning" />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            {/* High-risk users */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">High-Risk Users</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["User", "Dept", "Action", "Time"].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {highRiskUsers.map((u, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="px-4 py-2.5 font-mono text-xs text-primary">{u.user}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.dept}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={u.action.includes("Submitted") ? "bg-destructive/10 text-destructive border-destructive/20 text-[10px]" : "bg-warning/10 text-warning border-warning/20 text-[10px]"}>
                            {u.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{u.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Engagement rates */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-warning" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Engagement Rates</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-4">
                {[
                  { label: "Open Rate", value: Math.round((campaign.opened / campaign.sent) * 100), color: "[&>div]:bg-primary" },
                  { label: "Click Rate", value: clickRate, color: "[&>div]:bg-warning" },
                  { label: "Credential Submit Rate", value: submitRate, color: "[&>div]:bg-destructive" },
                  { label: "Report Rate (awareness)", value: reportRate, color: "[&>div]:bg-success" },
                ].map(r => (
                  <div key={r.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-mono font-bold text-card-foreground">{r.value}%</span>
                    </div>
                    <Progress value={r.value} className={`h-1.5 bg-secondary ${r.color}`} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Timeline */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Campaign Timeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 p-4">
            {timeline.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-none bg-primary mt-1 shrink-0" />
                  {i < timeline.length - 1 && <div className="w-px bg-border mt-1 mb-1 min-h-[1.5rem]" />}
                </div>
                <div className="pb-3">
                  <p className="font-mono text-[10px] text-muted-foreground">{t.time}</p>
                  <p className="text-xs text-card-foreground">{t.event}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
