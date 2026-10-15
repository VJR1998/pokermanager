type Client = Awaited<ReturnType<typeof import('#supabase/server').serverSupabaseClient>>

/**
 * Finds the tournament the signed-in user is currently working on: the oldest
 * tournament of their oldest group membership (their personal group).
 * Row level security already limits what the client can see to their groups.
 * Group/tournament switching will replace this once the UI has a selector.
 */
export async function findActiveTournament(client: Client, userId: string) {
  const { data: membership, error: memberError } = await client
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (memberError) throw memberError
  if (!membership) return null

  const { data: tournament, error } = await client
    .from('tournaments')
    .select('*')
    .eq('group_id', membership.group_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return tournament
}
