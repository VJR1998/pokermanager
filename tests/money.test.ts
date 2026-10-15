import { test } from 'node:test'
import assert from 'node:assert/strict'
import { minorDigits, toMinor, toMajor, formatMoney, CURRENCIES, DEFAULT_CURRENCY } from '../app/utils/money.ts'

test('GBP is the default and is first in the picker', () => {
  assert.equal(DEFAULT_CURRENCY, 'GBP')
  assert.equal(CURRENCIES[0].code, 'GBP')
})

test('every offered currency is known to Intl', () => {
  const known = new Set(Intl.supportedValuesOf('currency'))
  for (const c of CURRENCIES) assert.ok(known.has(c.code), c.code)
})

test('minor-unit digits follow the currency', () => {
  assert.equal(minorDigits('GBP'), 2)
  assert.equal(minorDigits('USD'), 2)
  assert.equal(minorDigits('JPY'), 0)
  assert.equal(minorDigits('KWD'), 3)
  assert.equal(minorDigits('???'), 2) // invalid code falls back safely
})

test('toMinor rounds away floating point noise', () => {
  assert.equal(toMinor(19.99, 'GBP'), 1999)
  assert.equal(toMinor(0.1 + 0.2, 'GBP'), 30)
  assert.equal(toMinor(10, 'GBP'), 1000)
  assert.equal(toMinor(500, 'JPY'), 500)
  assert.equal(toMinor(1.234, 'KWD'), 1234)
})

test('toMinor / toMajor tolerate junk', () => {
  assert.equal(toMinor(null, 'GBP'), 0)
  assert.equal(toMinor(undefined, 'GBP'), 0)
  assert.equal(toMinor(Number.NaN, 'GBP'), 0)
  assert.equal(toMajor(null, 'GBP'), 0)
  assert.equal(toMajor('abc' as unknown as number, 'GBP'), 0)
})

test('round trip is lossless for realistic buy-ins', () => {
  for (const major of [0, 1, 5, 10, 25.5, 100, 249.99, 1000]) {
    assert.equal(toMajor(toMinor(major, 'GBP'), 'GBP'), major)
  }
})

test('formatMoney is locale and currency aware', () => {
  assert.equal(formatMoney(1050, 'GBP', 'en-GB'), '£10.50')
  assert.equal(formatMoney(1000, 'USD', 'en-US'), '$10.00')
  assert.ok(formatMoney(500, 'JPY', 'en-GB').includes('500'))
  assert.ok(formatMoney(1050, 'EUR', 'de-DE').includes('10,50'))
  assert.equal(formatMoney(1050, 'XXXX', 'en-GB'), '10.5 XXXX') // bad code does not throw
})
