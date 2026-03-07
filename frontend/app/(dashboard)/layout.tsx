"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  )
}
