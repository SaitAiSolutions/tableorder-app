export function generateTableUrl(businessSlug: string, tableId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'

  return `${base}/menu/${businessSlug}/${tableId}`
}