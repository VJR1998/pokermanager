import { Pool } from 'pg'

const config = useRuntimeConfig()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const body = await readBody(event);

  const client = await pool.connect()
  try {
    const res = await client.query(
      'UPDATE tournaments SET title = $1::varchar, description = $2::varchar, starting_stack = $3::bigint, chipset = $4::jsonb, blinds = $5::jsonb, money = $6::jsonb, seating = $7::jsonb WHERE id = $8::uuid;',
      [body.title, body.description, body.starting_stack, JSON.stringify(body.chipset), JSON.stringify(body.blinds), JSON.stringify(body.money), JSON.stringify(body.seating), body.id]
    )
    return "Tournament Updated";
  } catch (err) {
    console.error('Server error:', err)
    return createError({ statusCode: 500, statusMessage: 'Server error: ' + err })
  } finally {
    client.release()
  }
})