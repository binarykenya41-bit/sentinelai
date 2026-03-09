// routes/proxy.js
import { Router } from 'fastify'

export async function proxyRoutes(fastify) {
  fastify.get('/api/proxy/vulnerabilities', async (req, reply) => {
    const res = await fetch(
      'https://periods-budapest-supports-organizing.trycloudflare.com/api/vulnerabilities?status=open&limit=20'
    )
    const data = await res.json()
    reply.send(data)
  })

  fastify.get('/api/proxy/simulation-results', async (req, reply) => {
    const res = await fetch(
      'https://periods-budapest-supports-organizing.trycloudflare.com/api/simulation/results?limit=50'
    )
    const data = await res.json()
    reply.send(data)
  })
}