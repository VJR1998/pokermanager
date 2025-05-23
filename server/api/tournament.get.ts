import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const { data: { user } } = await client.auth.getUser();
  try {
    const { data, error } = await client.from('tournaments').select('*').eq('user_id', user.id);
    return data;
  } catch (err) {
    console.error('Unexpected Error:', err)
    return createError({ statusCode: 500, statusMessage: 'Fetch Failed: ' + err.message })
  }
})
