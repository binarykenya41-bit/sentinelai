"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Toaster } from "sonner"
import { Shield, Loader2, ArrowRight, CheckCircle2 } from "lucide-react"

type Industry = "logistics" | "fintech" | "ecommerce" | "healthcare"

interface IndustryCard {
  id: Industry
  name: string
  description: string
  icon: string
  color: string
  borderColor: string
  badgeColor: string
  services: string[]
  stats: { label: string; value: string }[]
}

const INDUSTRIES: IndustryCard[] = [
  {
    id: "logistics",
    name: "GlobalShip Logistics",
    description: "Fleet management, ERP, supply chain operations with real-time tracking and vulnerability exposure.",
    icon: "🚢",
    color: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/30 hover:border-blue-400/60",
    badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    services: ["ERPNext", "GitLab", "Grafana", "Kafka", "PostgreSQL", "Redis", "Prometheus"],
    stats: [{ label: "CVEs", value: "47" }, { label: "Critical", value: "8" }, { label: "Services", value: "12" }],
  },
  {
    id: "fintech",
    name: "NexaPay Financial",
    description: "Core banking, payment processing and fraud detection with PCI-DSS compliance surface.",
    icon: "💳",
    color: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/30 hover:border-emerald-400/60",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    services: ["Fineract Banking", "Payment API", "Fraud Detection", "PostgreSQL", "Vault", "Redis"],
    stats: [{ label: "CVEs", value: "63" }, { label: "Critical", value: "12" }, { label: "Services", value: "9" }],
  },
  {
    id: "ecommerce",
    name: "ShopVault Commerce",
    description: "Full e-commerce stack: storefront, inventory management, payment gateway and object storage.",
    icon: "🛒",
    color: "from-orange-500/20 to-orange-600/5",
    borderColor: "border-orange-500/30 hover:border-orange-400/60",
    badgeColor: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    services: ["Storefront", "Product API", "Inventory DB", "Elasticsearch", "Redis", "MinIO"],
    stats: [{ label: "CVEs", value: "38" }, { label: "Critical", value: "5" }, { label: "Services", value: "8" }],
  },
  {
    id: "healthcare",
    name: "MediCore Health",
    description: "EHR system, patient portal and FHIR API with HIPAA compliance and PHI data exposure scenarios.",
    icon: "🏥",
    color: "from-rose-500/20 to-rose-600/5",
    borderColor: "border-rose-500/30 hover:border-rose-400/60",
    badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    services: ["OpenEMR", "FHIR API", "Patient Portal", "DICOM Viewer", "PostgreSQL", "HL7 Gateway"],
    stats: [{ label: "CVEs", value: "71" }, { label: "Critical", value: "15" }, { label: "Services", value: "11" }],
  },
]

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<Industry | null>(null)
  const [success, setSuccess] = useState<Industry | null>(null)

  const handleSelect = async (industry: Industry) => {
    if (loading) return
    setLoading(industry)

    try {
      await fetch(`${API_BASE}/api/industries/bootstrap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry }),
      })
    } catch {
      // Bootstrap endpoint may not be reachable — proceed anyway for demo
    }

    document.cookie = `sentinel-industry=${industry}; path=/; max-age=86400`
    setSuccess(industry)

    setTimeout(() => {
      router.push("/")
    }, 800)
  }

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors />

      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--primary) / 0.08) 0%, transparent 60%),
            linear-gradient(to bottom, transparent, hsl(var(--background)))
          `,
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Header */}
        <div className="mb-10 text-center relative z-10">
          <div className="mb-4 inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold tracking-widest text-foreground uppercase">
              Sentinel<span className="text-primary">AI</span>
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-bold text-foreground tracking-tight">
            Choose your demo environment
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Each environment simulates real industry infrastructure with pre-seeded vulnerabilities, running services, and live attack scenarios.
          </p>
        </div>

        {/* Industry cards grid */}
        <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
          {INDUSTRIES.map((ind) => {
            const isLoading = loading === ind.id
            const isSuccess = success === ind.id
            const isDisabled = loading !== null && loading !== ind.id

            return (
              <button
                key={ind.id}
                onClick={() => handleSelect(ind.id)}
                disabled={loading !== null}
                className={[
                  "group relative text-left rounded-xl border bg-card p-5 transition-all duration-300",
                  "shadow-lg hover:shadow-xl",
                  ind.borderColor,
                  isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                  isSuccess ? "scale-[1.01]" : "",
                ].join(" ")}
              >
                {/* Card gradient background */}
                <div
                  className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br ${ind.color} opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
                />

                <div className="relative z-10">
                  {/* Top row: icon + stats */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl leading-none">{ind.icon}</span>
                    <div className="flex gap-4">
                      {ind.stats.map((s) => (
                        <div key={s.label} className="text-center">
                          <p className="text-sm font-bold text-foreground">{s.value}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Name + description */}
                  <h2 className="text-base font-semibold text-foreground mb-1">{ind.name}</h2>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{ind.description}</p>

                  {/* Service badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {ind.services.map((svc) => (
                      <span
                        key={svc}
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${ind.badgeColor}`}
                      >
                        {svc}
                      </span>
                    ))}
                  </div>

                  {/* Launch button */}
                  <div
                    className={[
                      "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200",
                      isSuccess
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : isLoading
                        ? "bg-muted text-muted-foreground border border-border"
                        : "bg-primary/10 text-primary border border-primary/30 group-hover:bg-primary/20",
                    ].join(" ")}
                  >
                    {isSuccess ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Launching dashboard...
                      </>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Initializing environment...
                      </>
                    ) : (
                      <>
                        Launch Demo
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="relative z-10 mt-8 text-center text-[11px] text-muted-foreground max-w-sm">
          This demo simulates real infrastructure with pre-seeded vulnerabilities and running containers. No credentials required.
        </p>
      </div>
    </>
  )
}
