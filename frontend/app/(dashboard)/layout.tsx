"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "sonner"
import { IndustryProvider } from "@/lib/industry-context"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <IndustryProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <Toaster position="top-right" theme="dark" richColors />
      </div>
    </IndustryProvider>
  )
}
