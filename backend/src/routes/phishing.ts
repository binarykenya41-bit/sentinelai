import type { FastifyInstance } from "fastify"
import { supabase } from "../lib/supabase.js"

export async function phishingRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { status?: string; department?: string; limit?: string } }>(
    "/api/phishing", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      let q = supabase.from("phishing_campaigns").select("*", { count: "exact" })
        .order("created_at", { ascending: false })
      if (req.query.status) q = q.eq("status", req.query.status)
      if (req.query.department) q = q.eq("target_department", req.query.department)
      if (industry && industry !== 'all') q = q.eq("industry", industry)
      q = q.limit(parseInt(req.query.limit ?? "50"))
      const { data, error, count } = await q
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send({ total: count, campaigns: data })
    }
  )

  app.get("/api/phishing/stats", async (req, reply) => {
    const industry = req.headers['x-industry'] as string | undefined
    let statsQ = supabase.from("phishing_campaigns")
      .select("status, target_department, recipients_count, opened_count, clicked_count, submitted_count, reported_count")
    if (industry && industry !== 'all') statsQ = statsQ.eq("industry", industry)
    const { data, error } = await statsQ
    if (error) return reply.status(500).send({ error: error.message })
    const rows = data ?? []
    const completed = rows.filter(r => r.status === "Completed" && r.recipients_count)
    const totalRecipients = completed.reduce((s, r) => s + (r.recipients_count ?? 0), 0)
    const totalClicked = completed.reduce((s, r) => s + (r.clicked_count ?? 0), 0)
    const totalReported = completed.reduce((s, r) => s + (r.reported_count ?? 0), 0)
    const totalSubmitted = completed.reduce((s, r) => s + (r.submitted_count ?? 0), 0)
    const click_rate = totalRecipients ? Math.round((totalClicked / totalRecipients) * 100 * 10) / 10 : 0
    const report_rate = totalRecipients ? Math.round((totalReported / totalRecipients) * 100 * 10) / 10 : 0
    // Department risk: click rate per department
    const deptMap: Record<string, { recipients: number; clicked: number; submitted: number }> = {}
    for (const r of completed) {
      const dept = r.target_department
      if (!deptMap[dept]) deptMap[dept] = { recipients: 0, clicked: 0, submitted: 0 }
      deptMap[dept].recipients += r.recipients_count ?? 0
      deptMap[dept].clicked += r.clicked_count ?? 0
      deptMap[dept].submitted += r.submitted_count ?? 0
    }
    const dept_risk = Object.entries(deptMap).map(([dept, d]) => ({
      department: dept,
      click_rate: d.recipients ? Math.round((d.clicked / d.recipients) * 100 * 10) / 10 : 0,
      submitted_rate: d.recipients ? Math.round((d.submitted / d.recipients) * 100 * 10) / 10 : 0,
    })).sort((a, b) => b.click_rate - a.click_rate)

    return reply.send({
      total: rows.length,
      active: rows.filter(r => r.status === "Active").length,
      completed: completed.length,
      scheduled: rows.filter(r => r.status === "Scheduled").length,
      total_recipients: totalRecipients,
      total_clicked: totalClicked,
      total_submitted: totalSubmitted,
      total_reported: totalReported,
      click_rate,
      report_rate,
      dept_risk,
    })
  })

  app.get<{ Params: { id: string } }>("/api/phishing/:id", async (req, reply) => {
    const { data, error } = await supabase.from("phishing_campaigns").select("*").eq("campaign_id", req.params.id).single()
    if (error) return reply.status(404).send({ error: "Campaign not found" })
    return reply.send(data)
  })

  app.post<{ Body: { name: string; target_department: string; recipients_count?: number; template_name?: string; start_date?: string } }>(
    "/api/phishing", async (req, reply) => {
      const industry = req.headers['x-industry'] as string | undefined
      const id = `ph-${Date.now().toString(36)}`
      const { data, error } = await supabase.from("phishing_campaigns").insert({
        campaign_id: id,
        name: req.body.name,
        status: "Scheduled",
        target_department: req.body.target_department,
        recipients_count: req.body.recipients_count ?? 0,
        template_name: req.body.template_name ?? "Default",
        start_date: req.body.start_date ?? null,
        ...(industry && industry !== 'all' ? { industry } : {}),
      }).select().single()
      if (error) return reply.status(500).send({ error: error.message })
      return reply.status(201).send(data)
    }
  )
}
