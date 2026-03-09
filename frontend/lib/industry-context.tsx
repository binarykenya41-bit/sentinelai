"use client"

import React, { createContext, useContext, useMemo } from "react"
import { useRouter } from "next/navigation"

export type Industry = "logistics" | "fintech" | "ecommerce" | "healthcare"

export interface IndustryMeta {
  name: string
  description: string
  color: string
  accentColor: string
  icon: string
  services: string[]
  orgId: string
}

const INDUSTRY_META: Record<Industry, IndustryMeta> = {
  logistics: {
    name: "GlobalShip Logistics",
    description: "Fleet management, ERP, supply chain",
    color: "text-blue-400",
    accentColor: "bg-blue-500/10 border-blue-500/30",
    icon: "🚢",
    services: ["ERPNext", "GitLab", "Grafana", "Kafka", "PostgreSQL", "Redis", "Prometheus"],
    orgId: "a1b2c3d4-0001-0001-0001-000000000001",
  },
  fintech: {
    name: "NexaPay Financial",
    description: "Core banking, payments, fraud detection",
    color: "text-emerald-400",
    accentColor: "bg-emerald-500/10 border-emerald-500/30",
    icon: "💳",
    services: ["Fineract Banking", "Payment API", "Fraud Detection", "PostgreSQL", "Vault", "Redis"],
    orgId: "a1b2c3d4-0002-0002-0002-000000000002",
  },
  ecommerce: {
    name: "ShopVault Commerce",
    description: "Storefront, inventory, payments",
    color: "text-orange-400",
    accentColor: "bg-orange-500/10 border-orange-500/30",
    icon: "🛒",
    services: ["Storefront", "Product API", "Inventory DB", "Elasticsearch", "Redis", "MinIO"],
    orgId: "a1b2c3d4-0003-0003-0003-000000000003",
  },
  healthcare: {
    name: "MediCore Health",
    description: "EHR, patient portal, FHIR API",
    color: "text-rose-400",
    accentColor: "bg-rose-500/10 border-rose-500/30",
    icon: "🏥",
    services: ["OpenEMR", "FHIR API", "Patient Portal", "DICOM Viewer", "PostgreSQL", "HL7 Gateway"],
    orgId: "a1b2c3d4-0004-0004-0004-000000000004",
  },
}

const DEFAULT_META: IndustryMeta = {
  name: "SentinelAI Demo",
  description: "Select an industry environment",
  color: "text-primary",
  accentColor: "bg-primary/10 border-primary/30",
  icon: "🛡️",
  services: [],
  orgId: "",
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

interface IndustryContextValue {
  industry: Industry | null
  industryMeta: IndustryMeta
  clearIndustry: () => void
}

const IndustryContext = createContext<IndustryContextValue>({
  industry: null,
  industryMeta: DEFAULT_META,
  clearIndustry: () => {},
})

export function IndustryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  // Start with null on both server and client to avoid hydration mismatch.
  // Update to the real cookie value after mount (client only).
  const [industry, setIndustry] = React.useState<Industry | null>(null)

  React.useEffect(() => {
    const raw = getCookieValue("sentinel-industry")
    if (raw && raw in INDUSTRY_META) setIndustry(raw as Industry)
  }, [])

  const industryMeta = useMemo<IndustryMeta>(() => {
    if (industry) return INDUSTRY_META[industry]
    return DEFAULT_META
  }, [industry])

  const clearIndustry = () => {
    document.cookie = "sentinel-industry=; path=/; max-age=0"
    router.push("/login")
  }

  return (
    <IndustryContext.Provider value={{ industry, industryMeta, clearIndustry }}>
      {children}
    </IndustryContext.Provider>
  )
}

export function useIndustry() {
  return useContext(IndustryContext)
}
