export function formatCurrency(
  amount: number,
  currency = 'EUR',
  locale = 'el-GR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}