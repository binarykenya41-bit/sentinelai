import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { createRequire } from "module"

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Load .env from root
const dotenv = require("dotenv")
dotenv.config({ path: join(__dirname, "../.env") })

const { Client } = require("pg")

async function runFile(label, filePath) {
  const sql = readFileSync(filePath, "utf8")
  console.log(`\n▶  Running ${label}...`)

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    await client.query(sql)
    console.log(`  ✓ ${label} done`)
  } finally {
    await client.end()
  }
}

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ":***@"))

  await runFile("schema.sql", join(__dirname, "schema.sql"))
  await runFile("seeds/dev.sql", join(__dirname, "seeds/dev.sql"))
  await runFile("migrations/003-app-modules.sql", join(__dirname, "migrations/003-app-modules.sql"))

  console.log("\n✅  Migration complete!")
}

main().catch((e) => {
  console.error("\n❌  Migration failed:", e.message)
  process.exit(1)
})
