import { Pool } from 'pg'

const config = useRuntimeConfig()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const client = await pool.connect()
  try {
    const res = await client.query('SELECT * FROM tournaments;');
    // const res = await client.query('SELECT * FROM tournaments t JOIN users u ON u.userid = t.owner WHERE u.email = $1;',
    //   [user.email]
    // )
    return res.rows[0];
  } finally {
    client.release()
  }
})
