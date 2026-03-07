"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
  return (
    <div className="flex flex-col">
      <AppHeader title="Settings" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        {/* General */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">General</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Organization Name</Label>
              <Input defaultValue="Sentinel Security Corp" className="border-border bg-secondary text-foreground" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Admin Email</Label>
              <Input defaultValue="admin@sentinel.io" className="border-border bg-secondary text-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Scanning */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scanning Configuration</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-card-foreground">Automated Scanning</span>
                <p className="text-xs text-muted-foreground">Run vulnerability scans on a schedule</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-card-foreground">Auto Exploit Simulation</span>
                <p className="text-xs text-muted-foreground">Automatically simulate exploits for new findings</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Scan Frequency</Label>
              <Select defaultValue="6h">
                <SelectTrigger className="w-48 border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card text-card-foreground">
                  <SelectItem value="1h">Every 1 hour</SelectItem>
                  <SelectItem value="6h">Every 6 hours</SelectItem>
                  <SelectItem value="12h">Every 12 hours</SelectItem>
                  <SelectItem value="24h">Every 24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-card-foreground">Critical Vulnerability Alerts</span>
                <p className="text-xs text-muted-foreground">Notify immediately for critical findings</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-card-foreground">Exploit Simulation Results</span>
                <p className="text-xs text-muted-foreground">Notify when exploit simulations complete</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-card-foreground">Compliance Threshold Breaches</span>
                <p className="text-xs text-muted-foreground">Notify when compliance score drops below threshold</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure & Digital Twin */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Infrastructure & Digital Twin</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-card-foreground">Auto Discovery Sync</span>
                <p className="text-xs text-muted-foreground">Automatically pull inventory from connected API sources</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Discovery Sync Interval</Label>
              <Select defaultValue="30m">
                <SelectTrigger className="w-48 border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card text-card-foreground">
                  <SelectItem value="5m">Every 5 minutes</SelectItem>
                  <SelectItem value="15m">Every 15 minutes</SelectItem>
                  <SelectItem value="30m">Every 30 minutes</SelectItem>
                  <SelectItem value="1h">Every 1 hour</SelectItem>
                  <SelectItem value="6h">Every 6 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-card-foreground">Auto-update Digital Twin on Discovery</span>
                <p className="text-xs text-muted-foreground">Immediately reflect new or changed nodes in the digital twin model</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Default Sandbox Resource Limit</Label>
              <Select defaultValue="medium">
                <SelectTrigger className="w-48 border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card text-card-foreground">
                  <SelectItem value="small">Small — 2 vCPU / 4 GB RAM</SelectItem>
                  <SelectItem value="medium">Medium — 4 vCPU / 8 GB RAM</SelectItem>
                  <SelectItem value="large">Large — 8 vCPU / 16 GB RAM</SelectItem>
                  <SelectItem value="xlarge">XLarge — 16 vCPU / 32 GB RAM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator className="bg-border" />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Sandbox Max Lifetime</Label>
              <Select defaultValue="2h">
                <SelectTrigger className="w-48 border-border bg-secondary text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card text-card-foreground">
                  <SelectItem value="30m">30 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="2h">2 hours</SelectItem>
                  <SelectItem value="4h">4 hours</SelectItem>
                  <SelectItem value="8h">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-card-foreground">Require MFA for Exploit Simulations (CVSS ≥ 9.0)</span>
                <p className="text-xs text-muted-foreground">Force MFA confirmation before launching critical exploit tests</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Settings</Button>
        </div>
      </div>
    </div>
  )
}
