"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download } from "lucide-react"
import { SampleReport } from "@/components/reports/sample-report"
import { ReportMetrics } from "@/components/reports/report-metrics"

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false)

  return (
    <div className="flex flex-col">
      <AppHeader title="Reports" />
      <div className="flex flex-col gap-6 p-6">
        {/* Generate report panel */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-sm font-semibold text-card-foreground">Executive Security Assessment Report</span>
                <p className="text-xs text-muted-foreground">Generate a comprehensive security posture report for executive stakeholders</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export CSV
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 1500) }}
                disabled={generating}
              >
                {generating ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="report" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="report" className="data-[state=active]:bg-card data-[state=active]:text-card-foreground text-muted-foreground">
              Full Report
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-card data-[state=active]:text-card-foreground text-muted-foreground">
              Trend Metrics
            </TabsTrigger>
          </TabsList>
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
