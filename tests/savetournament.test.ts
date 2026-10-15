import { test } from 'node:test'
import assert from 'node:assert/strict'

// Minimal stand-ins for the Nuxt/Nitro auto-imports used by the route.
const g = globalThis as any
g.defineEventHandler = (fn: unknown) => fn
g.readBody = async (e: any) => e.body
g.createError = (o: any) => Object.assign(new Error(o.statusMessage), o)
g.requireUser = async (e: any) => ({ client: e.client, user: { id: 'u1' } })

const handler: any = (await import('../server/api/savetournament.post.ts')).default

const ID = '3f1c2a52-6d0e-4b8a-9a53-5a7a9d1f2b10'
let lastPatch: any
let lastId: any
const clientReturning = (result: unknown) => ({
  from: () => ({
    update: (patch: unknown) => {
      lastPatch = patch
      return { eq: (_col: string, id: unknown) => { lastId = id; return { select: () => ({ maybeSingle: async () => result }) } } }
    }
  })
})
const OK = { data: { updated_at: 't' }, error: null }

const good = {
  id: ID,
  title: 'Friday', description: '', starting_stack: '15000', currency: 'gbp',
  chipset: [{ id: 0, value: 25, primarycolour: '#ff6633', secondarycolour: '#fff', style: 'round', visible: true }],
  blinds: [{ level: 9, blinds: [100, 200], level_length: 20 }, { level: 3, blinds: [200, 400], level_length: 15 }],
  money: { buyInMinor: 1050, placesPaid: 2, split: [60, 40] },
  seating: { enabled: true, seats: 9 },
  group_id: 'attacker-group', created_by: 'attacker'
}

async function statusOf(body: unknown, result: unknown = OK) {
  try { await handler({ body, client: clientReturning(result) }); return 200 } catch (e: any) { return e.statusCode }
}

test('a valid save updates the row addressed by id, with cleaned values', async () => {
  assert.equal(await statusOf(good), 200)
  assert.equal(lastId, ID)
  assert.equal(lastPatch.starting_stack, 15000)                         // "15000" coerced to a number
  assert.equal(lastPatch.currency, 'GBP')                               // normalised to upper case
  assert.equal(lastPatch.money.buyInMinor, 1050)
  assert.deepEqual(lastPatch.blinds.map((b: any) => b.level), [0, 1])  // renumbered server-side
})

test('protected / unknown fields are dropped', async () => {
  await statusOf(good)
  for (const key of ['id', 'group_id', 'created_by', 'user_id', 'created_at']) assert.ok(!(key in lastPatch), key)
})

test('the tournament id is mandatory and must be a uuid', async () => {
  const { id, ...noId } = good
  assert.equal(await statusOf(noId), 400)
  assert.equal(await statusOf({ ...good, id: 'not-a-uuid' }), 400)
})

test('currency must be a real ISO code', async () => {
  assert.equal(await statusOf({ ...good, currency: 'ZZZZ' }), 400)
  assert.equal(await statusOf({ ...good, currency: 12 }), 400)
  assert.equal(await statusOf({ ...good, currency: 'jpy' }), 200)
})

test('buy-in must be a whole number of minor units', async () => {
  assert.equal(await statusOf({ ...good, money: { ...good.money, buyInMinor: 10.5 } }), 400)
  assert.equal(await statusOf({ ...good, money: { ...good.money, buyInMinor: -1 } }), 400)
  assert.equal(await statusOf({ ...good, money: { buyIn: 10, placesPaid: 2, split: [60, 40] } }), 400) // old pounds field is not a substitute
})

test('malformed values are rejected with 400', async () => {
  assert.equal(await statusOf({ ...good, starting_stack: 'abc' }), 400)
  assert.equal(await statusOf({ ...good, blinds: [] }), 400)
  assert.equal(await statusOf({ ...good, chipset: [{ ...good.chipset[0], primarycolour: '##fff' }] }), 400)
  assert.equal(await statusOf({ ...good, money: { ...good.money, split: [101] } }), 400)
  assert.equal(await statusOf({ ...good, seating: { enabled: true, seats: 99 } }), 400)
  assert.equal(await statusOf(null), 400)
  assert.equal(await statusOf({ id: ID }), 400) // nothing to save
})

test('database errors and permission denials are not reported as success', async () => {
  assert.equal(await statusOf(good, { data: null, error: { message: 'boom' } }), 500)
  assert.equal(await statusOf(good, { data: null, error: null }), 404) // zero rows: missing or read-only role
})
