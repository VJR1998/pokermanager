/**
 * Money helpers. Amounts are stored as integers in the currency's minor unit
 * (pence for GBP, cents for USD, whole yen for JPY) and only turned into
 * decimals for display / input.
 */

export interface CurrencyOption {
  code: string
  name: string
}

export const DEFAULT_CURRENCY = 'GBP'

export const CURRENCIES: CurrencyOption[] = [
  { code: 'GBP', name: 'British pound' },
  { code: 'EUR', name: 'Euro' },
  { code: 'USD', name: 'US dollar' },
  { code: 'CAD', name: 'Canadian dollar' },
  { code: 'AUD', name: 'Australian dollar' },
  { code: 'NZD', name: 'New Zealand dollar' },
  { code: 'CHF', name: 'Swiss franc' },
  { code: 'SEK', name: 'Swedish krona' },
  { code: 'NOK', name: 'Norwegian krone' },
  { code: 'DKK', name: 'Danish krone' },
  { code: 'PLN', name: 'Polish złoty' },
  { code: 'CZK', name: 'Czech koruna' },
  { code: 'ZAR', name: 'South African rand' },
  { code: 'INR', name: 'Indian rupee' },
  { code: 'JPY', name: 'Japanese yen' },
  { code: 'SGD', name: 'Singapore dollar' },
  { code: 'HKD', name: 'Hong Kong dollar' },
  { code: 'AED', name: 'UAE dirham' },
]

/** How many decimal places the currency's minor unit has (GBP 2, JPY 0, KWD 3). */
export function minorDigits(currency: string): number {
  try {
    const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits
    return typeof digits === 'number' ? digits : 2
  } catch {
    return 2
  }
}

/** 19.99 (major units) -> 1999 (minor units), rounding away float noise. */
export function toMinor(major: number | null | undefined, currency: string): number {
  const value = Number(major)
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 10 ** minorDigits(currency))
}

/** 1999 (minor units) -> 19.99 (major units). */
export function toMajor(minor: number | null | undefined, currency: string): number {
  const value = Number(minor)
  if (!Number.isFinite(value)) return 0
  return value / 10 ** minorDigits(currency)
}

/** Locale-aware display, e.g. formatMoney(1050, 'GBP', 'en-GB') -> "£10.50". */
export function formatMoney(minor: number | null | undefined, currency: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(toMajor(minor, currency))
  } catch {
    return `${toMajor(minor, currency)} ${currency}`
  }
}
