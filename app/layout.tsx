import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'SentinelAI - Autonomous Security Platform',
  description: 'Enterprise-grade AI-powered autonomous cybersecurity operations platform. Scan, exploit simulation, automated patching, and verified security scoring.',
}

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${ibmPlexSans.className} ${ibmPlexMono.className}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
