"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Server, Shield, Database, Radio } from "lucide-react"
import { SampleReport } from "@/components/reports/sample-report"
import { ReportMetrics } from "@/components/reports/report-metrics"
import { InfraReport } from "@/components/reports/infra-report"
import { simulationApi } from "@/lib/api-client"
import { toast } from "sonner"

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedingIntel, setSeedingIntel] = useState(false)

  const seedExploits = async () => {
    setSeeding(true)
    try {
      const res = await simulationApi.seedExploits()
      toast.success(`Seeded ${res.vulns_inserted} 2024 CVEs`, { description: res.inserted.join(", ") || "All already present" })
      await simulationApi.seedCompliance()
      toast.success("Compliance data seeded", { description: "ISO 27001 · SOC 2 · PCI-DSS controls refreshed" })
    } catch (e) {
      toast.error("Seed failed", { description: String(e) })
    } finally {
      setSeeding(false)
    }
  }

  const seedThreatIntel = async () => {
    setSeedingIntel(true)
    try {
      const res = await simulationApi.seedThreatIntel()
      const parts = Object.entries(res.summary).map(([k, v]) => `${k}: ${v}`).join(" · ")
      toast.success("Threat intel seeded", { description: parts })
    } catch (e) {
      toast.error("Threat intel seed failed", { description: String(e) })
    } finally {
      setSeedingIntel(false)
    }
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Reports" />
      <div className="flex flex-col gap-6 p-6">

        {/* Report controls */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-card-foreground">Executive Report</span>
                  <p className="text-xs text-muted-foreground">Security posture for stakeholders</p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 1500) }}
                disabled={generating}
              >
                {generating ? "Generating..." : "Generate"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Database className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-card-foreground">Seed 2024 CVE Data</span>
                  <p className="text-xs text-muted-foreground">8 critical 2024 CVEs + compliance controls</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">NEW</Badge>
                <Button variant="outline" size="sm" className="border-border" onClick={seedExploits} disabled={seeding}>
                  {seeding ? "Seeding…" : "Seed Data"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Radio className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-card-foreground">Seed Threat Intel</span>
                  <p className="text-xs text-muted-foreground">Threat feed · dark web · EDR · malware · phishing</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">LIVE</Badge>
                <Button variant="outline" size="sm" className="border-border" onClick={seedThreatIntel} disabled={seedingIntel}>
                  {seedingIntel ? "Seeding…" : "Seed Intel"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="infrastructure" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="infrastructure" className="data-[state=active]:bg-card data-[state=active]:text-card-foreground text-muted-foreground">
              <Server className="mr-1.5 h-3.5 w-3.5" /> Infrastructure PDF
            </TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-card data-[state=active]:text-card-foreground text-muted-foreground">
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Executive Report
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-card data-[state=active]:text-card-foreground text-muted-foreground">
              <Shield className="mr-1.5 h-3.5 w-3.5" /> Trend Metrics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="infrastructure" className="mt-4">
            <InfraReport />
          </TabsContent>
          <TabsContent value="report" className="mt-4">
            <SampleReport />
          </TabsContent>
          <TabsContent value="metrics" className="mt-4">
            <ReportMetrics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
