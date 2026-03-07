# 3. Frontend Guide

## Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15 (App Router) | Framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Lucide React | latest | Icons |
| Recharts / Chart.js | latest | Data visualization |
| Supabase JS | 2.x | Database client |

---

## Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx                  Root layout (fonts, metadata)
│   ├── globals.css                 Global theme (Sentinel AI brand)
│   └── (dashboard)/
│       ├── layout.tsx              Dashboard shell (sidebar + main)
│       ├── page.tsx                Dashboard home
│       ├── vulnerabilities/        CVE list + detail pages
│       ├── exploit-lab/            Simulation runner + results
│       ├── attack-graph/           Neo4j graph visualization
│       ├── patch-automation/       Patch status + CI/CD results
│       ├── threat-intelligence/    TI feed viewer
│       ├── compliance/             Control mapping dashboard
│       ├── reports/                Executive report generator
│       └── settings/               Platform settings
├── components/
│   ├── app-sidebar.tsx             Navigation sidebar
│   ├── app-header.tsx              Page header with search
│   ├── theme-provider.tsx          Theme context
│   ├── dashboard/                  Dashboard-specific widgets
│   │   ├── security-score.tsx      Posture score ring
│   │   ├── kpi-cards.tsx           Key metric cards
│   │   ├── exploit-timeline.tsx    Timeline chart
│   │   └── recent-alerts.tsx       Alert feed
│   ├── reports/                    Report components
│   └── ui/                         shadcn/ui base components
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
└── lib/
    ├── utils.ts                    cn() helper
    └── vuln-data.ts                Mock vulnerability data
```

---

## Brand Theme

The theme is defined in `app/globals.css` and follows the Sentinel AI visual identity:

```css
--primary:    #00d4ff   /* Cyan — active states, scores, CTAs */
--secondary:  #7c3aed   /* Purple — charts, badges, tables */
--background: #080c18   /* Deep navy */
--card:       #0d1220   /* Panel background */
--border:     #1a2540   /* Dividers */
```

### Adding a new page

1. Create `app/(dashboard)/your-page/page.tsx`
2. Use `<AppHeader title="Your Page" />` at the top
3. Wrap content in `<div className="flex flex-col gap-6 p-6">`
4. Use `<Card className="sentinel-card">` for panels

---

## Environment Variables (Frontend)

Set these in `frontend/.env.local` (or root `.env`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://lpivheudrpyzjqkegxww.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev       # Dev server → http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint
```

---

## Pages Checklist

| Route | Status | Description |
|---|---|---|
| `/` | Done | Dashboard home with score + KPIs |
| `/vulnerabilities` | Done | CVE table with filters |
| `/vulnerabilities/[cve]` | Done | CVE detail page |
| `/exploit-lab` | Done | Simulation launcher |
| `/exploit-lab/[simId]` | Done | Simulation result detail |
| `/attack-graph` | Done | Graph visualization |
| `/attack-graph/[nodeId]` | Done | Node detail |
| `/patch-automation` | Done | Patch queue |
| `/patch-automation/[cve]` | Done | Patch detail |
| `/threat-intelligence` | Done | TI feed |
| `/threat-intelligence/[cve]` | Done | TI CVE detail |
| `/compliance` | Done | Control framework view |
| `/compliance/[controlId]` | Done | Control detail |
| `/reports` | Done | Report generation |
| `/settings` | Done | Platform settings |
