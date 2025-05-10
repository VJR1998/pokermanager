import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("SERVER", body);
  
  const client = await serverSupabaseClient(event);

  try {
    const { data, error } = await client.rpc('addUserLogin', {
      auserid: body.userid,
      afirstname: body.credentials.given_name,
      asurname: body.credentials.family_name,
      aemail: body.credentials.email,
      apicture: body.credentials.picture
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