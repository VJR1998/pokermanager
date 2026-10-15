const bad = (message: string) => createError({ statusCode: 400, statusMessage: message })

const isObject = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

function int(v: unknown, name: string, min: number, max: number): number {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    throw bad(`${name} must be a whole number between ${min} and ${max}`)
  }
  return n
}

function num(v: unknown, name: string, min: number, max: number): number {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) {
    throw bad(`${name} must be a number between ${min} and ${max}`)
  }
  return n
}

function str(v: unknown, name: string, max: number): string {
  if (typeof v !== 'string' || v.length > max) throw bad(`${name} must be text up to ${max} characters`)
  return v
}

const HEX = /^#[0-9a-fA-F]{3,8}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CURRENCIES = new Set(Intl.supportedValuesOf('currency'))

/** Whitelists and validates the editable columns. Unknown fields (group_id, created_by, ...) are dropped. */
function sanitize(body: unknown) {
  if (!isObject(body)) throw bad('Invalid request body')
  const patch: Record<string, unknown> = {}

  if ('currency' in body) {
    const code = typeof body.currency === 'string' ? body.currency.toUpperCase() : ''
    if (!CURRENCIES.has(code)) throw bad('currency must be a valid ISO 4217 code')
    patch.currency = code
  }

  if ('title' in body) patch.title = str(body.title, 'title', 100)
  if ('description' in body) patch.description = str(body.description, 'description', 2000)
  if ('starting_stack' in body) patch.starting_stack = int(body.starting_stack, 'starting_stack', 0, 1_000_000_000)

  if ('chipset' in body) {
    if (!Array.isArray(body.chipset) || body.chipset.length > 30) throw bad('chipset must be a list of up to 30 chips')
    patch.chipset = body.chipset.map((c: any, i: number) => {
      if (!isObject(c)) throw bad(`chipset[${i}] is invalid`)
      if (typeof c.primarycolour !== 'string' || !HEX.test(c.primarycolour)) throw bad(`chipset[${i}].primarycolour must be a hex colour`)
      if (typeof c.secondarycolour !== 'string' || !HEX.test(c.secondarycolour)) throw bad(`chipset[${i}].secondarycolour must be a hex colour`)
      return {
        id: int(c.id, `chipset[${i}].id`, 0, 1_000_000),
        value: int(c.value, `chipset[${i}].value`, 1, 1_000_000_000),
        primarycolour: c.primarycolour,
        secondarycolour: c.secondarycolour,
        style: 'round',
        visible: c.visible !== false
      }
    })
  }

  if ('blinds' in body) {
    if (!Array.isArray(body.blinds) || body.blinds.length < 1 || body.blinds.length > 100) {
      throw bad('blinds must be a list of 1 to 100 levels')
    }
    patch.blinds = body.blinds.map((b: any, i: number) => {
      if (!isObject(b) || !Array.isArray(b.blinds) || b.blinds.length !== 2) throw bad(`blinds[${i}] is invalid`)
      return {
        level: i, // always renumbered server-side so levels stay contiguous and 0-based
        blinds: [
          int(b.blinds[0], `blinds[${i}] small blind`, 0, 1_000_000_000),
          int(b.blinds[1], `blinds[${i}] big blind`, 0, 1_000_000_000)
        ],
        level_length: int(b.level_length, `blinds[${i}].level_length`, 1, 600)
      }
    })
  }

  if ('money' in body) {
    const m = body.money
    if (!isObject(m) || !Array.isArray(m.split) || m.split.length > 50) throw bad('money is invalid')
    patch.money = {
      buyInMinor: int(m.buyInMinor, 'buyInMinor', 0, 1_000_000_000_000), // minor units (pence for GBP)
      placesPaid: int(m.placesPaid, 'placesPaid', 1, 50),
      split: m.split.map((s: unknown, i: number) => num(s, `split[${i}]`, 0, 100))
    }
  }

  if ('seating' in body) {
    const s = body.seating
    if (!isObject(s)) throw bad('seating is invalid')
    patch.seating = {
      enabled: s.enabled === true,
      seats: int(s.seats, 'seats', 2, 12)
    }
  }

  if (Object.keys(patch).length === 0) throw bad('Nothing to save')
  return patch
}

export default defineEventHandler(async (event) => {
  const { client } = await requireUser(event)
  const body = await readBody(event)
  const patch = sanitize(body)

  const id = isObject(body) ? body.id : undefined
  if (typeof id !== 'string' || !UUID.test(id)) throw bad('A tournament id is required')

  // Row level security decides whether the caller may edit this tournament
  // (owner / director of its group); anything else updates zero rows.
  const { data, error } = await client
    .from('tournaments')
    .update(patch)
    .eq('id', id)
    .select('updated_at')
    .maybeSingle()

  if (error) {
    console.error('Tournament save failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'Could not save tournament' })
  }
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Tournament not found, or you do not have permission to edit it' })
  }

  return { ok: true, updated_at: data.updated_at }
})
