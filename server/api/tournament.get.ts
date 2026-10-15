export default defineEventHandler(async (event) => {
  const { client, user } = await requireUser(event)

  try {
    let tournament = await findActiveTournament(client, user.id)

    if (!tournament) {
      // Safety net for accounts that pre-date the signup trigger: provision a personal
      // group and default tournament, then look again.
      const { error } = await client.rpc('addUserLogin', {
        auserid: user.id,
        afirstname: null,
        asurname: null,
        picture: null
      })
      if (error) throw error
      tournament = await findActiveTournament(client, user.id)
    }

    if (!tournament) {
      throw createError({ statusCode: 500, statusMessage: 'Could not create tournament' })
    }
    return tournament
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('Tournament fetch failed:', err?.message)
    throw createError({ statusCode: 500, statusMessage: 'Could not load tournament' })
  }
})
