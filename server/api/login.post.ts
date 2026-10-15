/**
 * Called by the login page right after Supabase has signed the user in.
 * Identity is taken from the verified Supabase session (cookies), never from
 * the request body.
 */
export default defineEventHandler(async (event) => {
  const { client, user } = await requireUser(event)

  const md = (user.user_metadata ?? {}) as Record<string, any>
  const fullName = String(md.full_name ?? md.name ?? '').trim()
  const [firstFromName, ...restOfName] = fullName ? fullName.split(/\s+/) : []

  const { error } = await client.rpc('addUserLogin', {
    auserid: user.id,
    afirstname: md.given_name ?? firstFromName ?? null,
    asurname: md.family_name ?? (restOfName.length ? restOfName.join(' ') : null),
    picture: md.picture ?? md.avatar_url ?? null
  })

  if (error) {
    console.error('addUserLogin failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'Authorisation failed' })
  }

  return { ok: true }
})
