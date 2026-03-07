"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { Server, Wifi, Settings, Shield, AlertTriangle, Globe, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"

type Section = {
  id: string
  label: string
  icon: React.ElementType
}

const sections: Section[] = [
  { id: "general", label: "General Information", icon: Server },
  { id: "network", label: "Network Details", icon: Wifi },
  { id: "system", label: "System Configuration", icon: Settings },
  { id: "security", label: "Security Configuration", icon: Shield },
  { id: "patch", label: "Patch & Vulnerability Status", icon: AlertTriangle },
  { id: "integration", label: "Integration Settings", icon: Globe },
]

export default function AddInfrastructurePage() {
  const [openSection, setOpenSection] = useState<string>("general")
  const [firewallPresent, setFirewallPresent] = useState(true)
  const [edrInstalled, setEdrInstalled] = useState(false)
  const [avInstalled, setAvInstalled] = useState(false)

  const toggle = (id: string) => setOpenSection(prev => prev === id ? "" : id)

  return (
    <div className="flex flex-col">
      <AppHeader title="Add Infrastructure Node" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">
            Complete all sections to register a new infrastructure node in the digital twin model.
          </p>
          <Link href="/infrastructure">
            <Button variant="outline" className="border-border text-xs h-7 px-3">Cancel</Button>
          </Link>
        </div>

        {/* Section 1 — General Information */}
        <Card className="border-border bg-card overflow-hidden">
          <button
            onClick={() => toggle("general")}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">1. General Information</CardTitle>
            </div>
            {openSection === "general" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
          {openSection === "general" && (
            <CardContent className="flex flex-col gap-4 px-5 pb-5">
              <Separator className="bg-border" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Infrastructure Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. prod-web-cluster-01" className="border-border bg-secondary text-foreground text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Infrastructure Type <span className="text-destructive">*</span></Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="cloud-vm">Cloud VM</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="firewall">Firewall</SelectItem>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="switch">Switch</SelectItem>
                      <SelectItem value="endpoint">Endpoint Device</SelectItem>
                      <SelectItem value="container-host">Container Host</SelectItem>
                      <SelectItem value="api-service">API Service</SelectItem>
                      <SelectItem value="identity-system">Identity System</SelectItem>
                      <SelectItem value="load-balancer">Load Balancer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Environment <span className="text-destructive">*</span></Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="dr">Disaster Recovery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Criticality</Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="Select criticality" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <textarea
                  placeholder="Brief description of this infrastructure node and its role..."
                  className="min-h-[72px] w-full resize-none border border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground rounded-[2%] focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 2 — Network Details */}
        <Card className="border-border bg-card overflow-hidden">
          <button
            onClick={() => toggle("network")}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">2. Network Details</CardTitle>
            </div>
            {openSection === "network" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
          {openSection === "network" && (
            <CardContent className="flex flex-col gap-4 px-5 pb-5">
              <Separator className="bg-border" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">IP Address <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. 10.0.1.10" className="border-border bg-secondary text-foreground font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Hostname</Label>
                  <Input placeholder="e.g. prod-web-01.internal" className="border-border bg-secondary text-foreground font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">MAC Address</Label>
                  <Input placeholder="e.g. 00:1A:2B:3C:4D:5E" className="border-border bg-secondary text-foreground font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Network Segment / VLAN</Label>
                  <Input placeholder="e.g. VLAN-100 / 10.0.1.0/24" className="border-border bg-secondary text-foreground font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Open Ports</Label>
                  <Input placeholder="e.g. 22, 80, 443, 8080" className="border-border bg-secondary text-foreground font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Protocols Used</Label>
                  <Input placeholder="e.g. TCP, UDP, HTTPS, SSH" className="border-border bg-secondary text-foreground text-xs" />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 3 — System Configuration */}
        <Card className="border-border bg-card overflow-hidden">
          <button
            onClick={() => toggle("system")}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">3. System Configuration</CardTitle>
            </div>
            {openSection === "system" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
          {openSection === "system" && (
            <CardContent className="flex flex-col gap-4 px-5 pb-5">
              <Separator className="bg-border" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Operating System <span className="text-destructive">*</span></Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="Select OS" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="ubuntu-22">Ubuntu 22.04 LTS</SelectItem>
                      <SelectItem value="ubuntu-20">Ubuntu 20.04 LTS</SelectItem>
                      <SelectItem value="debian-12">Debian 12</SelectItem>
                      <SelectItem value="rhel-9">RHEL 9</SelectItem>
                      <SelectItem value="rhel-8">RHEL 8</SelectItem>
                      <SelectItem value="centos-stream-9">CentOS Stream 9</SelectItem>
                      <SelectItem value="win-server-2022">Windows Server 2022</SelectItem>
                      <SelectItem value="win-server-2019">Windows Server 2019</SelectItem>
                      <SelectItem value="win-11">Windows 11</SelectItem>
                      <SelectItem value="alpine">Alpine Linux</SelectItem>
                      <SelectItem value="flatcar">Flatcar Linux</SelectItem>
                      <SelectItem value="macos">macOS</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">OS Version / Build</Label>
                  <Input placeholder="e.g. 22.04.3 LTS / 23H2" className="border-border bg-secondary text-foreground font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <Label className="text-xs text-muted-foreground">Installed Applications</Label>
                  <textarea
                    placeholder="List key applications (name + version), one per line. e.g.&#10;nginx 1.24.0&#10;postgresql 15.4&#10;openssl 3.0.2"
                    className="min-h-[80px] w-full resize-none border border-border bg-secondary px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground rounded-[2%] focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Container Platform</Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="None / Not applicable" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="docker">Docker</SelectItem>
                      <SelectItem value="kubernetes">Kubernetes</SelectItem>
                      <SelectItem value="containerd">containerd</SelectItem>
                      <SelectItem value="podman">Podman</SelectItem>
                      <SelectItem value="openshift">OpenShift</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Container Version</Label>
                  <Input placeholder="e.g. Kubernetes 1.29.1" className="border-border bg-secondary text-foreground font-mono text-xs" />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 4 — Security Configuration */}
        <Card className="border-border bg-card overflow-hidden">
          <button
            onClick={() => toggle("security")}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">4. Security Configuration</CardTitle>
            </div>
            {openSection === "security" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
          {openSection === "security" && (
            <CardContent className="flex flex-col gap-4 px-5 pb-5">
              <Separator className="bg-border" />
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-card-foreground">Firewall Present</p>
                    <p className="text-[11px] text-muted-foreground">Host-based or network firewall protecting this node</p>
                  </div>
                  <Switch checked={firewallPresent} onCheckedChange={setFirewallPresent} />
                </div>
                {firewallPresent && (
                  <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-primary/20">
                    <Label className="text-xs text-muted-foreground">Firewall Type / Product</Label>
                    <Input placeholder="e.g. iptables, Windows Defender Firewall, FortiGate" className="border-border bg-secondary text-foreground text-xs" />
                  </div>
                )}
                <Separator className="bg-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-card-foreground">Endpoint Security Agent Installed</p>
                    <p className="text-[11px] text-muted-foreground">EDR, XDR, or security monitoring agent</p>
                  </div>
                  <Switch checked={edrInstalled} onCheckedChange={setEdrInstalled} />
                </div>
                {edrInstalled && (
                  <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-primary/20">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Agent Name</Label>
                      <Input placeholder="e.g. CrowdStrike Falcon, SentinelOne" className="border-border bg-secondary text-foreground text-xs" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Agent Version</Label>
                      <Input placeholder="e.g. 6.47.15801" className="border-border bg-secondary text-foreground font-mono text-xs" />
                    </div>
                  </div>
                )}
                <Separator className="bg-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-card-foreground">Antivirus / AV Installed</p>
                    <p className="text-[11px] text-muted-foreground">Traditional antivirus software (distinct from EDR)</p>
                  </div>
                  <Switch checked={avInstalled} onCheckedChange={setAvInstalled} />
                </div>
                {avInstalled && (
                  <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-primary/20">
                    <Label className="text-xs text-muted-foreground">AV Product</Label>
                    <Input placeholder="e.g. Windows Defender, ESET, Sophos" className="border-border bg-secondary text-foreground text-xs" />
                  </div>
                )}
                <Separator className="bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Authentication Type</Label>
                    <Select>
                      <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                        <SelectValue placeholder="Select auth type" />
                      </SelectTrigger>
                      <SelectContent className="bg-card text-card-foreground">
                        <SelectItem value="password">Password</SelectItem>
                        <SelectItem value="mfa">MFA (TOTP / Push)</SelectItem>
                        <SelectItem value="certificate">Certificate / PKI</SelectItem>
                        <SelectItem value="sso">SSO / SAML</SelectItem>
                        <SelectItem value="api-key">API Key</SelectItem>
                        <SelectItem value="iam-role">IAM Role (AWS/Azure/GCP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Encryption Protocols</Label>
                    <Input placeholder="e.g. TLS 1.3, AES-256-GCM" className="border-border bg-secondary text-foreground font-mono text-xs" />
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 5 — Patch & Vulnerability Status */}
        <Card className="border-border bg-card overflow-hidden">
          <button
            onClick={() => toggle("patch")}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">5. Patch & Vulnerability Status</CardTitle>
            </div>
            {openSection === "patch" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
          {openSection === "patch" && (
            <CardContent className="flex flex-col gap-4 px-5 pb-5">
              <Separator className="bg-border" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Patch Status</Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="current">Current — all patches applied</SelectItem>
                      <SelectItem value="behind">Behind — patches pending</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="end-of-life">End of Life (EoL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Last Patch Date</Label>
                  <Input type="date" className="border-border bg-secondary text-foreground text-xs" />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <Label className="text-xs text-muted-foreground">Known CVEs</Label>
                  <Input placeholder="e.g. CVE-2024-1234, CVE-2024-5678" className="border-border bg-secondary text-foreground font-mono text-xs" />
                  <p className="text-[10px] text-muted-foreground">Comma-separated list. Sentinel will enrich and link these automatically via the TI pipeline.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Highest CVE Severity</Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="critical">Critical (CVSS 9.0–10.0)</SelectItem>
                      <SelectItem value="high">High (CVSS 7.0–8.9)</SelectItem>
                      <SelectItem value="medium">Medium (CVSS 4.0–6.9)</SelectItem>
                      <SelectItem value="low">Low (CVSS 0.1–3.9)</SelectItem>
                      <SelectItem value="none">None known</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Patch Management Source</Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="ivanti">Ivanti</SelectItem>
                      <SelectItem value="sccm">SCCM / Intune</SelectItem>
                      <SelectItem value="jamf">Jamf</SelectItem>
                      <SelectItem value="kaseya">Kaseya</SelectItem>
                      <SelectItem value="aws-ssm">AWS Systems Manager</SelectItem>
                      <SelectItem value="ansible">Ansible</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 6 — Integration Settings */}
        <Card className="border-border bg-card overflow-hidden">
          <button
            onClick={() => toggle("integration")}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">6. Integration Settings</CardTitle>
            </div>
            {openSection === "integration" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
          {openSection === "integration" && (
            <CardContent className="flex flex-col gap-4 px-5 pb-5">
              <Separator className="bg-border" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">External Management Tool</Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="Select tool (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="ivanti">Ivanti Neurons</SelectItem>
                      <SelectItem value="sccm">SCCM</SelectItem>
                      <SelectItem value="jamf">Jamf Pro</SelectItem>
                      <SelectItem value="kaseya">Kaseya VSA</SelectItem>
                      <SelectItem value="pdq">PDQ Deploy</SelectItem>
                      <SelectItem value="cisco-dna">Cisco DNA Center</SelectItem>
                      <SelectItem value="fortimanager">FortiManager</SelectItem>
                      <SelectItem value="juniper">Juniper APIs</SelectItem>
                      <SelectItem value="zabbix">Zabbix</SelectItem>
                      <SelectItem value="nagios">Nagios</SelectItem>
                      <SelectItem value="prtg">PRTG</SelectItem>
                      <SelectItem value="splunk">Splunk</SelectItem>
                      <SelectItem value="elk">ELK Stack</SelectItem>
                      <SelectItem value="graylog">Graylog</SelectItem>
                      <SelectItem value="aws">AWS</SelectItem>
                      <SelectItem value="azure">Azure</SelectItem>
                      <SelectItem value="gcp">Google Cloud</SelectItem>
                      <SelectItem value="none">None — Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">API Endpoint URL</Label>
                  <Input placeholder="https://tool.corp.internal/api/v1" className="border-border bg-secondary text-foreground font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Authentication Method</Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="Select auth method" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="api-key">API Key</SelectItem>
                      <SelectItem value="bearer">Bearer Token (JWT)</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="oauth2">OAuth 2.0 Client Credentials</SelectItem>
                      <SelectItem value="cert">mTLS Certificate</SelectItem>
                      <SelectItem value="aws-iam">AWS IAM Role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">API Key / Token</Label>
                  <Input type="password" placeholder="Stored encrypted in Vault" className="border-border bg-secondary text-foreground font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Log Source Configuration</Label>
                  <Input placeholder="e.g. syslog://10.0.5.8:514" className="border-border bg-secondary text-foreground font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Log Format</Label>
                  <Select>
                    <SelectTrigger className="border-border bg-secondary text-foreground text-xs">
                      <SelectValue placeholder="Select log format" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground">
                      <SelectItem value="syslog">Syslog (RFC 5424)</SelectItem>
                      <SelectItem value="cef">CEF (Common Event Format)</SelectItem>
                      <SelectItem value="leef">LEEF</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="windows-event">Windows Event Log</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-2">
          <Link href="/infrastructure">
            <Button variant="outline" className="border-border text-xs">Cancel</Button>
          </Link>
          <Button variant="outline" className="border-border text-xs">Save as Draft</Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
            Register Node
          </Button>
        </div>
      </div>
    </div>
  )
}
