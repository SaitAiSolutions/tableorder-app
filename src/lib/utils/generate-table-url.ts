export function generateTableUrl(businessSlug: string, tableId: string): string {
  const safeSlug = encodeURIComponent(businessSlug)
  const safeTableId = encodeURIComponent(tableId)

  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '')
    return `${origin}/menu/${safeSlug}/${safeTableId}`
  }

  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://tableorder-app.vercel.app'
  ).replace(/\/$/, '')

  return `${base}/menu/${safeSlug}/${safeTableId}`
}