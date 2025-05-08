import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log("SERVER", body);

  const client = await serverSupabaseClient(event);

  try {
    const { data, error } = await client.rpc('addApproveLoginUser', {
      afirstname: body.given_name,
      asurname: body.family_name,
      aemail: body.email,
      apicture: body.picture
    })

    if (error) {
      console.error('RPC Error:', error)
      return createError({ statusCode: 500, statusMessage: 'Authorisation Failed: ' + error.message })
    }

    await setUserSession(event, {
      user: {
        name: body.name,
        email: body.email,
        picture: body.picture
      }
    })

    return "Authorisation Successful"
  } catch (err) {
    console.error('Unexpected Error:', err)
    return createError({ statusCode: 500, statusMessage: 'Authorisation Failed: ' + err.message })
  }
})