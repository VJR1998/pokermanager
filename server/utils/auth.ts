import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

/**
 * Returns the Supabase client (acting as the caller, so RLS applies) and the
 * verified user. Throws a 401 if there is no valid session.
 */
export async function requireUser(event: H3Event) {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client.auth.getUser()
  const user = data?.user

  if (error || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
  }

  return { client, user }
}
