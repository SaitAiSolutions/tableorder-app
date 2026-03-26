export function isTrialExpired(trialEndsAt?: string | null) {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt).getTime() < Date.now()
}

export function getRemainingTrialDays(trialEndsAt?: string | null) {
  if (!trialEndsAt) return null

  const diff = new Date(trialEndsAt).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  return Math.max(days, 0)
}