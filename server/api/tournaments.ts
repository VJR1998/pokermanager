import { Pool } from 'pg'

const config = useRuntimeConfig()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Set this in .env
})

export default defineEventHandler(async () => {
  const client = await pool.connect()
  try {
    const res = await client.query('SELECT * FROM tournaments t JOIN tournament_settings ts ON ts.tournament_id = t.id')
    return res.rows[0]
  } finally {
    client.release()
  }
})
