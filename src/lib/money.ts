export type Currency = {
  code?: string;
  symbol?: string;
};

const SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  UAH: '₴',
  AZN: '₼',
  SAR: '﷼',
  AED: 'د.إ',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  RON: 'lei',
  BGN: 'лв',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
  CAD: '$',
  AUD: '$',
};

export function currencySymbol(currency: Currency): string {
  if (currency.symbol) return currency.symbol;
  if (currency.code && SYMBOLS[currency.code]) return SYMBOLS[currency.code];
  return currency.code ?? '';
}

export function formatMoney(amount: number, currency: Currency, locale: string): string {
  const rounded = Math.round(amount * 100) / 100;

  if (currency.code && !currency.symbol) {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.code }).format(rounded);
    } catch {
      return fallbackFormat(rounded, currency, locale);
    }
  }

  return fallbackFormat(rounded, currency, locale);
}

function fallbackFormat(amount: number, currency: Currency, locale: string): string {
  const number = amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const symbol = currencySymbol(currency);
  return symbol ? `${number} ${symbol}` : number;
}
