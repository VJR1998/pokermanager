import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const client = await serverSupabaseClient(event);

  const { data: { user } } = await client.auth.getUser();

  try {
    const { data, error } = await client.from('tournaments').update({ title: body.title, description: body.description, starting_stack: body.starting_stack, chipset: body.chipset, blinds: body.blinds, money: body.money, seating: body.seating }).eq('user_id', user.id);
    return "Tournament Updated";
  } catch (err) {
    console.error('Server error:', err)
    return createError({ statusCode: 500, statusMessage: 'Server error: ' + err })
  }
})