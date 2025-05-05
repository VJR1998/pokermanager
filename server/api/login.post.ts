import { Pool } from 'pg'

const config = useRuntimeConfig()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log("SERVER", body);

  const client = await pool.connect()
  try {
    const res = await client.query(
      'SELECT public."addApproveLoginUser"($1::varchar, $2::varchar, $3::varchar, $4::varchar)',
      [body.given_name, body.family_name, body.email, body.picture]
    )
    return "Authorisation Successful";
  } catch (err) {
    console.error('Authorisation Failed:', err)
    return createError({ statusCode: 500, statusMessage: 'Authorisation Failed: ' + err })
  } finally {
    client.release()
  }
})